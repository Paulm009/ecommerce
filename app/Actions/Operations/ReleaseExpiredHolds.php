<?php

declare(strict_types=1);

namespace App\Actions\Operations;

use App\Enums\ReservationStatus;
use App\Models\EventInventoryMovement;
use App\Models\EventLocationInventory;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\PaymentAttempt;
use App\Models\ProductOrder;
use App\Models\PromotionRedemption;
use App\Models\TicketReservation;
use App\Models\TicketReservationEvent;
use App\Models\TicketTypeInventory;
use Illuminate\Support\Facades\DB;

final class ReleaseExpiredHolds
{
    /** @return array{tickets: int, product_orders: int, pos_sales: int} */
    public function handle(): array
    {
        $counts = ['tickets' => 0, 'product_orders' => 0, 'pos_sales' => 0];

        TicketReservation::query()
            ->where(function ($query): void {
                $query->where(fn ($selection) => $selection->where('status', ReservationStatus::TemporarySelection)->where('selection_expires_at', '<=', now()))
                    ->orWhere(fn ($payment) => $payment->where('status', ReservationStatus::PendingPayment)->where('payment_expires_at', '<=', now()));
            })
            ->select('id')
            ->chunkById(100, function ($reservations) use (&$counts): void {
                foreach ($reservations as $reservation) {
                    DB::transaction(function () use ($reservation, &$counts): void {
                        $lockedReservation = TicketReservation::query()->with('items')->lockForUpdate()->findOrFail($reservation->id);

                        if (! in_array($lockedReservation->status, [ReservationStatus::TemporarySelection, ReservationStatus::PendingPayment], true)) {
                            return;
                        }

                        $fromBucket = $lockedReservation->status === ReservationStatus::TemporarySelection ? 'selection' : 'payment_reserved';
                        foreach ($lockedReservation->items as $item) {
                            $locationInventory = EventLocationInventory::query()->lockForUpdate()->findOrFail($item->event_location_id);
                            $ticketInventory = TicketTypeInventory::query()->lockForUpdate()->findOrFail($item->ticket_type_id);
                            $locationInventory->update([
                                $fromBucket.'_quantity' => $locationInventory->{$fromBucket.'_quantity'} - $item->quantity,
                                'available_quantity' => $locationInventory->available_quantity + $item->quantity,
                                'lock_version' => $locationInventory->lock_version + 1,
                            ]);
                            $ticketInventory->update([
                                $fromBucket.'_quantity' => $ticketInventory->{$fromBucket.'_quantity'} - $item->quantity,
                                'available_quantity' => $ticketInventory->available_quantity === null ? null : $ticketInventory->available_quantity + $item->quantity,
                                'lock_version' => $ticketInventory->lock_version + 1,
                            ]);
                            $item->update(['status' => 'released']);
                            EventInventoryMovement::query()->create([
                                'event_location_id' => $item->event_location_id,
                                'ticket_type_id' => $item->ticket_type_id,
                                'movement_type' => 'reservation_expired',
                                'quantity' => $item->quantity,
                                'from_bucket' => $fromBucket,
                                'to_bucket' => 'available',
                                'reservation_item_id' => $item->id,
                            ]);
                        }

                        $previousStatus = $lockedReservation->status;
                        $lockedReservation->update(['status' => ReservationStatus::Expired, 'expired_at' => now()]);
                        $lockedReservation->sale?->update(['status' => 'expired', 'expired_at' => now()]);
                        if ($lockedReservation->sale_id !== null) {
                            PaymentAttempt::query()->where('sale_id', $lockedReservation->sale_id)->where('status', 'pending')->update(['status' => 'expired']);
                            PromotionRedemption::query()->where('sale_id', $lockedReservation->sale_id)->update(['status' => 'released']);
                        }
                        TicketReservationEvent::query()->create([
                            'ticket_reservation_id' => $lockedReservation->id,
                            'event_type' => 'expired',
                            'previous_status' => $previousStatus->value,
                            'new_status' => ReservationStatus::Expired->value,
                        ]);
                        $counts['tickets']++;
                    }, 3);
                }
            });

        ProductOrder::query()
            ->where('status', 'pending_payment')
            ->where('payment_expires_at', '<=', now())
            ->select('id')
            ->chunkById(100, function ($orders) use (&$counts): void {
                foreach ($orders as $order) {
                    DB::transaction(function () use ($order, &$counts): void {
                        $lockedOrder = ProductOrder::query()->with(['items.reservation', 'sale'])->lockForUpdate()->findOrFail($order->id);

                        if ($lockedOrder->status->value !== 'pending_payment') {
                            return;
                        }

                        foreach ($lockedOrder->items as $item) {
                            $reservation = $item->reservation;

                            if ($reservation === null || $reservation->status !== 'active') {
                                continue;
                            }

                            $balance = InventoryBalance::query()->lockForUpdate()->findOrFail($item->product_variant_id);
                            $reservedBefore = $balance->reserved_quantity;
                            $balance->update([
                                'reserved_quantity' => $balance->reserved_quantity - $item->quantity,
                                'available_quantity' => $balance->available_quantity + $item->quantity,
                                'lock_version' => $balance->lock_version + 1,
                            ]);
                            $reservation->update(['status' => 'released', 'released_at' => now()]);
                            InventoryMovement::query()->create([
                                'product_variant_id' => $item->product_variant_id,
                                'movement_type' => 'web_reservation_released',
                                'reserved_delta' => -$item->quantity,
                                'on_hand_before' => $balance->on_hand_quantity,
                                'on_hand_after' => $balance->on_hand_quantity,
                                'reserved_before' => $reservedBefore,
                                'reserved_after' => $balance->reserved_quantity,
                                'product_order_item_id' => $item->id,
                                'inventory_reservation_id' => $reservation->id,
                            ]);
                        }

                        $lockedOrder->update(['status' => 'cancelled', 'cancelled_at' => now(), 'cancellation_reason' => 'Pago vencido']);
                        $lockedOrder->sale->update(['status' => 'expired', 'expired_at' => now()]);
                        PaymentAttempt::query()->where('sale_id', $lockedOrder->sale_id)->where('status', 'pending')->update(['status' => 'expired']);
                        $counts['product_orders']++;
                    }, 3);
                }
            });

        PaymentAttempt::query()
            ->where('status', 'pending')
            ->where('qr_expires_at', '<=', now())
            ->whereHas('sale', fn ($query) => $query->where('channel', 'pos'))
            ->with('sale.posSale.items')
            ->chunkById(100, function ($attempts) use (&$counts): void {
                foreach ($attempts as $attempt) {
                    DB::transaction(function () use ($attempt, &$counts): void {
                        $lockedAttempt = PaymentAttempt::query()->with('sale.posSale.items')->lockForUpdate()->findOrFail($attempt->id);

                        if ($lockedAttempt->status->value !== 'pending') {
                            return;
                        }

                        $posSale = $lockedAttempt->sale->posSale;
                        foreach ($posSale->items as $item) {
                            $balance = InventoryBalance::query()->lockForUpdate()->findOrFail($item->product_variant_id);
                            $reservedBefore = $balance->reserved_quantity;
                            $balance->update([
                                'reserved_quantity' => $balance->reserved_quantity - $item->quantity,
                                'available_quantity' => $balance->available_quantity + $item->quantity,
                                'lock_version' => $balance->lock_version + 1,
                            ]);
                            InventoryMovement::query()->create([
                                'product_variant_id' => $item->product_variant_id,
                                'movement_type' => 'pos_reservation_released',
                                'reserved_delta' => -$item->quantity,
                                'on_hand_before' => $balance->on_hand_quantity,
                                'on_hand_after' => $balance->on_hand_quantity,
                                'reserved_before' => $reservedBefore,
                                'reserved_after' => $balance->reserved_quantity,
                                'pos_sale_item_id' => $item->id,
                            ]);
                        }
                        $posSale->update(['status' => 'cancelled', 'cancelled_at' => now(), 'cancellation_reason' => 'Pago vencido']);
                        $lockedAttempt->sale->update(['status' => 'expired', 'expired_at' => now()]);
                        $lockedAttempt->update(['status' => 'expired']);
                        $counts['pos_sales']++;
                    }, 3);
                }
            });

        return $counts;
    }
}
