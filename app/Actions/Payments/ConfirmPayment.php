<?php

declare(strict_types=1);

namespace App\Actions\Payments;

use App\Enums\CashSessionStatus;
use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Jobs\SendPaymentConfirmationEmail;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\EventInventoryMovement;
use App\Models\EventLocationInventory;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\OutboxEvent;
use App\Models\PaymentAttempt;
use App\Models\PaymentEvent;
use App\Models\PaymentIncident;
use App\Models\PosSale;
use App\Models\ProductOrder;
use App\Models\PromotionRedemption;
use App\Models\Ticket;
use App\Models\TicketEntitlement;
use App\Models\TicketOrder;
use App\Models\TicketOrderItem;
use App\Models\TicketReservation;
use App\Models\TicketReservationEvent;
use App\Models\TicketTypeInventory;
use App\Support\TicketQrToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ConfirmPayment
{
    public function __construct(private TicketQrToken $qrTokens) {}

    public function handle(PaymentAttempt $paymentAttempt, string $providerTransactionId, ?string $providerEventId = null, string $source = 'webhook'): PaymentAttempt
    {
        $confirmedPayment = DB::transaction(function () use ($paymentAttempt, $providerTransactionId, $providerEventId, $source): PaymentAttempt {
            $paymentAttempt = PaymentAttempt::query()->with('sale')->lockForUpdate()->findOrFail($paymentAttempt->id);

            if ($paymentAttempt->status === PaymentStatus::Paid) {
                return $paymentAttempt;
            }

            if ($providerEventId !== null && PaymentEvent::query()->where('provider_code', $paymentAttempt->provider_code)->where('provider_event_id', $providerEventId)->exists()) {
                return $paymentAttempt;
            }

            $paymentEvent = PaymentEvent::query()->create([
                'payment_attempt_id' => $paymentAttempt->id,
                'provider_code' => $paymentAttempt->provider_code,
                'provider_event_id' => $providerEventId,
                'event_source' => $source,
                'event_type' => 'payment_confirmed',
                'signature_valid' => true,
                'raw_payload' => ['transaction_id' => $providerTransactionId],
            ]);

            $lateOperationalRecord = $this->lateOperationalRecord($paymentAttempt);
            $paymentAttempt->update([
                'status' => PaymentStatus::Paid,
                'provider_transaction_id' => $providerTransactionId,
                'confirmed_at' => now(),
                'last_checked_at' => now(),
            ]);

            if ($lateOperationalRecord !== null) {
                $paymentAttempt->sale->update(['status' => 'payment_incident']);
                PaymentIncident::query()->firstOrCreate(
                    ['payment_attempt_id' => $paymentAttempt->id, 'incident_type' => 'late_confirmation'],
                    [
                        'sale_id' => $paymentAttempt->sale_id,
                        'ticket_reservation_id' => $lateOperationalRecord instanceof TicketReservation ? $lateOperationalRecord->id : null,
                        'expected_amount' => $paymentAttempt->amount,
                        'received_amount' => $paymentAttempt->amount,
                        'description' => 'El banco confirmó el pago después del vencimiento. Requiere revisión y devolución manual.',
                    ],
                );
                $paymentEvent->update(['processing_status' => 'processed', 'processing_message' => 'late_confirmation', 'processed_at' => now()]);

                return $paymentAttempt->fresh(['sale']);
            }

            match ($paymentAttempt->sale->channel) {
                'web' => $paymentAttempt->sale->sale_type === 'tickets'
                    ? $this->completeTicketSale($paymentAttempt)
                    : $this->completeProductOrder($paymentAttempt),
                'ticket_office' => $this->completeTicketSale($paymentAttempt),
                'pos' => $this->completePosSale($paymentAttempt),
                default => throw ValidationException::withMessages(['payment' => 'El pago no corresponde a un flujo compatible.']),
            };

            $paymentEvent->update(['processing_status' => 'processed', 'processed_at' => now()]);
            OutboxEvent::query()->create([
                'aggregate_type' => 'payment_attempt',
                'aggregate_id' => $paymentAttempt->id,
                'event_type' => 'payment.confirmed',
                'payload_json' => ['sale_id' => $paymentAttempt->sale_id],
            ]);

            return $paymentAttempt->fresh(['sale.ticketOrder.tickets', 'sale.productOrder', 'sale.posSale']);
        }, 3);

        SendPaymentConfirmationEmail::dispatch($confirmedPayment->id);

        return $confirmedPayment;
    }

    private function lateOperationalRecord(PaymentAttempt $paymentAttempt): TicketReservation|ProductOrder|PosSale|null
    {
        if ($paymentAttempt->sale->sale_type === 'tickets') {
            $reservation = TicketReservation::query()->where('sale_id', $paymentAttempt->sale_id)->lockForUpdate()->first();

            return $reservation !== null && ($reservation->payment_expires_at?->isPast() || $reservation->status === ReservationStatus::Expired)
                ? $reservation
                : null;
        }

        if ($paymentAttempt->sale->channel === 'pos') {
            return $paymentAttempt->qr_expires_at?->isPast()
                ? PosSale::query()->where('sale_id', $paymentAttempt->sale_id)->first()
                : null;
        }

        $order = ProductOrder::query()->where('sale_id', $paymentAttempt->sale_id)->lockForUpdate()->first();

        return $order !== null && ($order->payment_expires_at?->isPast() || $order->status->value === 'cancelled') ? $order : null;
    }

    private function completeTicketSale(PaymentAttempt $paymentAttempt): void
    {
        $reservation = TicketReservation::query()
            ->with(['items.ticketType', 'items.location', 'occurrence.event'])
            ->where('sale_id', $paymentAttempt->sale_id)
            ->lockForUpdate()
            ->firstOrFail();
        $order = TicketOrder::query()->create([
            'sale_id' => $paymentAttempt->sale_id,
            'ticket_reservation_id' => $reservation->id,
            'event_occurrence_id' => $reservation->event_occurrence_id,
            'order_number' => $paymentAttempt->sale->public_number,
            'buyer_name' => $reservation->buyer_name,
            'buyer_email' => $reservation->buyer_email,
            'buyer_phone' => $reservation->buyer_phone,
            'buyer_identity_document' => $reservation->buyer_identity_document,
            'event_name_snapshot' => $reservation->occurrence->event->name,
            'occurrence_starts_at_snapshot' => $reservation->occurrence->starts_at,
        ]);
        $orderItems = collect();

        foreach ($reservation->items as $reservationItem) {
            $locationInventory = EventLocationInventory::query()->lockForUpdate()->findOrFail($reservationItem->event_location_id);
            $ticketInventory = TicketTypeInventory::query()->lockForUpdate()->findOrFail($reservationItem->ticket_type_id);
            $locationInventory->update([
                'payment_reserved_quantity' => $locationInventory->payment_reserved_quantity - $reservationItem->quantity,
                'sold_quantity' => $locationInventory->sold_quantity + $reservationItem->quantity,
                'lock_version' => $locationInventory->lock_version + 1,
            ]);
            $ticketInventory->update([
                'payment_reserved_quantity' => $ticketInventory->payment_reserved_quantity - $reservationItem->quantity,
                'sold_quantity' => $ticketInventory->sold_quantity + $reservationItem->quantity,
                'lock_version' => $ticketInventory->lock_version + 1,
            ]);
            $orderItem = TicketOrderItem::query()->create([
                'ticket_order_id' => $order->id,
                'ticket_type_id' => $reservationItem->ticket_type_id,
                'event_location_id' => $reservationItem->event_location_id,
                'ticket_type_name_snapshot' => $reservationItem->ticketType->name,
                'location_label_snapshot' => $reservationItem->location->label,
                'location_external_key_snapshot' => $reservationItem->location->external_key,
                'quantity' => $reservationItem->quantity,
                'unit_price' => $reservationItem->unit_price_snapshot,
                'line_total' => $reservationItem->line_subtotal,
            ]);
            $orderItems->push($orderItem);
            EventInventoryMovement::query()->create([
                'event_location_id' => $reservationItem->event_location_id,
                'ticket_type_id' => $reservationItem->ticket_type_id,
                'movement_type' => 'ticket_sold',
                'quantity' => $reservationItem->quantity,
                'from_bucket' => 'payment_reserved',
                'to_bucket' => 'sold',
                'reservation_item_id' => $reservationItem->id,
                'ticket_order_item_id' => $orderItem->id,
            ]);
        }

        $ticketId = (string) Str::uuid();
        $qrToken = $this->qrTokens->for($ticketId);
        $ticket = Ticket::query()->create([
            'id' => $ticketId,
            'event_occurrence_id' => $reservation->event_occurrence_id,
            'ticket_order_id' => $order->id,
            'public_code' => 'TKT-'.Str::upper(Str::random(16)),
            'qr_token_hash' => hash('sha256', $qrToken),
            'quota_total' => $reservation->items->sum('quantity'),
            'recipient_name' => $reservation->buyer_name,
            'recipient_email' => $reservation->buyer_email,
        ]);

        foreach ($orderItems as $index => $orderItem) {
            $reservationItem = $reservation->items->values()[$index];
            TicketEntitlement::query()->create([
                'ticket_id' => $ticket->id,
                'ticket_order_item_id' => $orderItem->id,
                'ticket_type_id' => $orderItem->ticket_type_id,
                'event_location_id' => $orderItem->event_location_id,
                'quantity' => $reservationItem->quantity,
            ]);
        }

        $reservation->update(['status' => ReservationStatus::Paid, 'paid_at' => now()]);
        $paymentAttempt->sale->update(['status' => 'paid', 'paid_at' => now()]);
        PromotionRedemption::query()->where('sale_id', $paymentAttempt->sale_id)->update(['status' => 'consumed', 'consumed_at' => now()]);
        TicketReservationEvent::query()->create([
            'ticket_reservation_id' => $reservation->id,
            'event_type' => 'paid',
            'previous_status' => ReservationStatus::PendingPayment->value,
            'new_status' => ReservationStatus::Paid->value,
            'payment_attempt_id' => $paymentAttempt->id,
        ]);
    }

    private function completeProductOrder(PaymentAttempt $paymentAttempt): void
    {
        $order = ProductOrder::query()
            ->with(['items.reservation'])
            ->where('sale_id', $paymentAttempt->sale_id)
            ->lockForUpdate()
            ->firstOrFail();

        foreach ($order->items as $item) {
            $reservation = $item->reservation;
            $balance = InventoryBalance::query()->lockForUpdate()->findOrFail($item->product_variant_id);

            if ($reservation === null || $reservation->status !== 'active' || $balance->reserved_quantity < $item->quantity || $balance->on_hand_quantity < $item->quantity) {
                throw ValidationException::withMessages(['inventory' => 'La reserva de inventario no puede consumirse.']);
            }

            $onHandBefore = $balance->on_hand_quantity;
            $reservedBefore = $balance->reserved_quantity;
            $balance->update([
                'on_hand_quantity' => $balance->on_hand_quantity - $item->quantity,
                'reserved_quantity' => $balance->reserved_quantity - $item->quantity,
                'lock_version' => $balance->lock_version + 1,
            ]);
            $reservation->update(['status' => 'consumed', 'consumed_at' => now()]);
            InventoryMovement::query()->create([
                'product_variant_id' => $item->product_variant_id,
                'movement_type' => 'web_sale',
                'on_hand_delta' => -$item->quantity,
                'reserved_delta' => -$item->quantity,
                'on_hand_before' => $onHandBefore,
                'on_hand_after' => $balance->on_hand_quantity,
                'reserved_before' => $reservedBefore,
                'reserved_after' => $balance->reserved_quantity,
                'product_order_item_id' => $item->id,
                'inventory_reservation_id' => $reservation->id,
            ]);
        }

        $order->update(['status' => 'paid', 'paid_at' => now()]);
        $paymentAttempt->sale->update(['status' => 'paid', 'paid_at' => now()]);
    }

    private function completePosSale(PaymentAttempt $paymentAttempt): void
    {
        $posSale = PosSale::query()->with('items')->where('sale_id', $paymentAttempt->sale_id)->lockForUpdate()->firstOrFail();
        $cashSession = CashSession::query()->lockForUpdate()->findOrFail($posSale->cash_session_id);

        if ($cashSession->status !== CashSessionStatus::Open) {
            throw ValidationException::withMessages(['cash_session' => 'La caja fue cerrada antes de confirmar el pago.']);
        }

        foreach ($posSale->items as $item) {
            $balance = InventoryBalance::query()->lockForUpdate()->findOrFail($item->product_variant_id);

            if ($balance->reserved_quantity < $item->quantity || $balance->on_hand_quantity < $item->quantity) {
                throw ValidationException::withMessages(['inventory' => 'La reserva de inventario del POS ya no está disponible.']);
            }

            $onHandBefore = $balance->on_hand_quantity;
            $reservedBefore = $balance->reserved_quantity;
            $balance->update([
                'on_hand_quantity' => $balance->on_hand_quantity - $item->quantity,
                'reserved_quantity' => $balance->reserved_quantity - $item->quantity,
                'lock_version' => $balance->lock_version + 1,
            ]);
            InventoryMovement::query()->create([
                'product_variant_id' => $item->product_variant_id,
                'movement_type' => 'pos_sale',
                'on_hand_delta' => -$item->quantity,
                'reserved_delta' => -$item->quantity,
                'on_hand_before' => $onHandBefore,
                'on_hand_after' => $balance->on_hand_quantity,
                'reserved_before' => $reservedBefore,
                'reserved_after' => $balance->reserved_quantity,
                'pos_sale_item_id' => $item->id,
                'performed_by_user_id' => $posSale->seller_user_id,
            ]);
        }

        $posSale->update(['status' => 'confirmed', 'confirmed_at' => now()]);
        $paymentAttempt->sale->update(['status' => 'paid', 'paid_at' => now()]);
        CashMovement::query()->create([
            'cash_session_id' => $cashSession->id,
            'movement_type' => 'pos_sale',
            'direction' => 'in',
            'amount' => $paymentAttempt->amount,
            'pos_sale_id' => $posSale->id,
            'payment_attempt_id' => $paymentAttempt->id,
            'description' => 'Venta POS '.$posSale->sale_number,
            'created_by_user_id' => $posSale->seller_user_id,
        ]);
    }
}
