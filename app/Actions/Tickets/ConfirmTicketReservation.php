<?php

declare(strict_types=1);

namespace App\Actions\Tickets;

use App\Contracts\Payments\QrPaymentGateway;
use App\Enums\ReservationStatus;
use App\Models\CompanySetting;
use App\Models\EventInventoryMovement;
use App\Models\EventLocationInventory;
use App\Models\PaymentAttempt;
use App\Models\PromotionCode;
use App\Models\PromotionRedemption;
use App\Models\Sale;
use App\Models\SaleDiscount;
use App\Models\TicketReservation;
use App\Models\TicketReservationEvent;
use App\Models\TicketTypeInventory;
use App\Support\GeneratesPublicNumbers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ConfirmTicketReservation
{
    public function __construct(
        private GeneratesPublicNumbers $numbers,
        private QrPaymentGateway $gateway,
    ) {}

    /**
     * @param  array{buyer_name: string, buyer_email?: string|null, buyer_phone?: string|null, buyer_identity_document?: string|null, promotion_code?: string|null}  $buyer
     */
    public function handle(TicketReservation $reservation, array $buyer): PaymentAttempt
    {
        $paymentAttempt = DB::transaction(function () use ($reservation, $buyer): PaymentAttempt {
            $reservation = TicketReservation::query()
                ->with(['items', 'occurrence.event'])
                ->lockForUpdate()
                ->findOrFail($reservation->id);

            if ($reservation->status !== ReservationStatus::TemporarySelection || $reservation->selection_expires_at->isPast()) {
                throw ValidationException::withMessages(['reservation' => 'La selección temporal venció. Vuelve a elegir tus ubicaciones.']);
            }

            $settings = CompanySetting::query()->find($reservation->occurrence->event->company_id);
            $paymentExpiresAt = now()->addMinutes($settings?->payment_reservation_minutes ?? 20);
            $totalAmount = $this->sumMoney($reservation->items->pluck('line_subtotal')->map(static fn (mixed $amount): string => (string) $amount)->all());
            [$promotion, $discountAmount] = $this->promotion($reservation, $buyer['promotion_code'] ?? null, $totalAmount);
            $payableAmount = $this->centsToMoney($this->moneyToCents($totalAmount) - $this->moneyToCents($discountAmount));
            $sale = Sale::query()->create([
                'company_id' => $reservation->occurrence->event->company_id,
                'public_number' => $this->numbers->next($reservation->occurrence->event->company_id, 'ticket_sale', 'TR'),
                'sale_type' => 'tickets',
                'channel' => $reservation->created_by_user_id === null ? 'web' : 'ticket_office',
                'created_by_user_id' => $reservation->created_by_user_id,
                'subtotal_amount' => $totalAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $payableAmount,
                'status' => 'pending_payment',
            ]);

            if ($promotion !== null) {
                SaleDiscount::query()->create([
                    'sale_id' => $sale->id,
                    'promotion_code_id' => $promotion->id,
                    'description' => 'Código promocional '.$promotion->code,
                    'discount_type_snapshot' => $promotion->discount_type,
                    'discount_value_snapshot' => $promotion->discount_value,
                    'discount_amount' => $discountAmount,
                ]);
                PromotionRedemption::query()->create(['promotion_code_id' => $promotion->id, 'sale_id' => $sale->id, 'discount_amount' => $discountAmount]);
            }

            foreach ($reservation->items as $item) {
                $locationInventory = EventLocationInventory::query()->lockForUpdate()->findOrFail($item->event_location_id);
                $ticketInventory = TicketTypeInventory::query()->lockForUpdate()->findOrFail($item->ticket_type_id);

                $locationInventory->update([
                    'selection_quantity' => $locationInventory->selection_quantity - $item->quantity,
                    'payment_reserved_quantity' => $locationInventory->payment_reserved_quantity + $item->quantity,
                    'lock_version' => $locationInventory->lock_version + 1,
                ]);
                $ticketInventory->update([
                    'selection_quantity' => $ticketInventory->selection_quantity - $item->quantity,
                    'payment_reserved_quantity' => $ticketInventory->payment_reserved_quantity + $item->quantity,
                    'lock_version' => $ticketInventory->lock_version + 1,
                ]);

                EventInventoryMovement::query()->create([
                    'event_location_id' => $item->event_location_id,
                    'ticket_type_id' => $item->ticket_type_id,
                    'movement_type' => 'payment_reservation',
                    'quantity' => $item->quantity,
                    'from_bucket' => 'selection',
                    'to_bucket' => 'payment_reserved',
                    'reservation_item_id' => $item->id,
                ]);
            }

            $reservation->update([
                ...$buyer,
                'sale_id' => $sale->id,
                'status' => ReservationStatus::PendingPayment,
                'confirmed_at' => now(),
                'payment_expires_at' => $paymentExpiresAt,
            ]);

            TicketReservationEvent::query()->create([
                'ticket_reservation_id' => $reservation->id,
                'event_type' => 'confirmed',
                'previous_status' => ReservationStatus::TemporarySelection->value,
                'new_status' => ReservationStatus::PendingPayment->value,
            ]);

            return PaymentAttempt::query()->create([
                'sale_id' => $sale->id,
                'provider_code' => 'demo_bank',
                'idempotency_key' => (string) Str::uuid(),
                'amount' => $payableAmount,
                'currency_code' => $settings?->currency_code ?? 'BOB',
                'status' => 'pending',
                'qr_expires_at' => $paymentExpiresAt,
            ]);
        }, 3);

        $gatewayResponse = $this->gateway->requestPayment($paymentAttempt);
        $paymentAttempt->update([
            'provider_reference' => $gatewayResponse['provider_reference'],
            'qr_payload_encrypted' => $gatewayResponse['qr_payload'],
            'qr_expires_at' => $gatewayResponse['expires_at'],
        ]);

        return $paymentAttempt->fresh(['sale']);
    }

    /** @param array<int, string> $amounts */
    private function sumMoney(array $amounts): string
    {
        $totalCents = 0;

        foreach ($amounts as $amount) {
            [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');
            $totalCents += ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');
        }

        return sprintf('%d.%02d', intdiv($totalCents, 100), $totalCents % 100);
    }

    /** @return array{PromotionCode|null, string} */
    private function promotion(TicketReservation $reservation, ?string $code, string $subtotal): array
    {
        if ($code === null || trim($code) === '') {
            return [null, '0.00'];
        }

        $promotion = PromotionCode::query()
            ->where('event_id', $reservation->occurrence->event_id)
            ->where('code', strtoupper(trim($code)))
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->lockForUpdate()
            ->first();

        if ($promotion === null || ($promotion->minimum_amount !== null && $this->moneyToCents($subtotal) < $this->moneyToCents((string) $promotion->minimum_amount))) {
            throw ValidationException::withMessages(['promotion_code' => 'El código promocional no es válido para esta compra.']);
        }

        if ($promotion->maximum_redemptions !== null && PromotionRedemption::query()->where('promotion_code_id', $promotion->id)->whereIn('status', ['reserved', 'consumed'])->count() >= $promotion->maximum_redemptions) {
            throw ValidationException::withMessages(['promotion_code' => 'El código promocional alcanzó su límite de usos.']);
        }

        $subtotalCents = $this->moneyToCents($subtotal);
        $discountCents = $promotion->discount_type === 'percentage'
            ? intdiv($subtotalCents * $this->moneyToCents((string) $promotion->discount_value), 10000)
            : $this->moneyToCents((string) $promotion->discount_value);

        if ($promotion->maximum_discount !== null) {
            $discountCents = min($discountCents, $this->moneyToCents((string) $promotion->maximum_discount));
        }

        return [$promotion, $this->centsToMoney(min($subtotalCents, $discountCents))];
    }

    private function moneyToCents(string $amount): int
    {
        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '0');

        return ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');
    }

    private function centsToMoney(int $cents): string
    {
        return sprintf('%d.%02d', intdiv($cents, 100), abs($cents % 100));
    }
}
