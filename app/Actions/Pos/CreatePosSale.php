<?php

declare(strict_types=1);

namespace App\Actions\Pos;

use App\Contracts\Payments\QrPaymentGateway;
use App\Enums\CashSessionStatus;
use App\Models\CashSession;
use App\Models\Company;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\PaymentAttempt;
use App\Models\PosSale;
use App\Models\PosSaleItem;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\User;
use App\Support\GeneratesPublicNumbers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreatePosSale
{
    public function __construct(
        private GeneratesPublicNumbers $numbers,
        private QrPaymentGateway $gateway,
    ) {}

    /** @param array<int, array{product_variant_id: string, quantity: int}> $requestedItems */
    public function handle(Company $company, CashSession $cashSession, User $seller, array $requestedItems): PaymentAttempt
    {
        $paymentAttempt = DB::transaction(function () use ($company, $cashSession, $seller, $requestedItems): PaymentAttempt {
            $cashSession = CashSession::query()->lockForUpdate()->findOrFail($cashSession->id);

            if ($cashSession->status !== CashSessionStatus::Open) {
                throw ValidationException::withMessages(['cash_session' => 'La caja debe estar abierta antes de registrar una venta.']);
            }

            $preparedItems = collect($requestedItems)->sortBy('product_variant_id')->map(function (array $requestedItem) use ($company): array {
                $variant = ProductVariant::query()->with('product:id,company_id,name')->findOrFail($requestedItem['product_variant_id']);
                $balance = InventoryBalance::query()->lockForUpdate()->findOrFail($variant->id);
                $quantity = $requestedItem['quantity'];

                if ($variant->product->company_id !== $company->id || $quantity < 1 || $balance->available_quantity < $quantity) {
                    throw ValidationException::withMessages(['items' => 'No existe stock suficiente para completar la venta.']);
                }

                return ['variant' => $variant, 'balance' => $balance, 'quantity' => $quantity];
            });
            $total = $this->centsToMoney($preparedItems->sum(fn (array $item): int => $this->moneyToCents((string) $item['variant']->sale_price) * $item['quantity']));
            $number = $this->numbers->next($company->id, 'pos_sale', 'POS');
            $sale = Sale::query()->create([
                'company_id' => $company->id,
                'public_number' => $number,
                'sale_type' => 'products',
                'channel' => 'pos',
                'created_by_user_id' => $seller->id,
                'subtotal_amount' => $total,
                'total_amount' => $total,
                'status' => 'pending_payment',
            ]);
            $posSale = PosSale::query()->create([
                'sale_id' => $sale->id,
                'sale_number' => $number,
                'cash_session_id' => $cashSession->id,
                'seller_user_id' => $seller->id,
            ]);

            foreach ($preparedItems as $preparedItem) {
                $variant = $preparedItem['variant'];
                $balance = $preparedItem['balance'];
                $quantity = $preparedItem['quantity'];
                $lineTotalCents = $this->moneyToCents((string) $variant->sale_price) * $quantity;
                $costTotalCents = $this->moneyToCents((string) $variant->purchase_cost) * $quantity;
                $item = PosSaleItem::query()->create([
                    'pos_sale_id' => $posSale->id,
                    'product_variant_id' => $variant->id,
                    'product_name_snapshot' => $variant->product->name,
                    'variant_name_snapshot' => $variant->name,
                    'sku_snapshot' => $variant->sku,
                    'quantity' => $quantity,
                    'unit_price' => $variant->sale_price,
                    'unit_cost' => $variant->purchase_cost,
                    'line_total' => $this->centsToMoney($lineTotalCents),
                    'cost_total' => $this->centsToMoney($costTotalCents),
                    'profit_amount' => $this->centsToMoney($lineTotalCents - $costTotalCents),
                ]);

                $balance->update([
                    'reserved_quantity' => $balance->reserved_quantity + $quantity,
                    'available_quantity' => $balance->available_quantity - $quantity,
                    'lock_version' => $balance->lock_version + 1,
                ]);
                InventoryMovement::query()->create([
                    'product_variant_id' => $variant->id,
                    'movement_type' => 'pos_reservation',
                    'reserved_delta' => $quantity,
                    'on_hand_before' => $balance->on_hand_quantity,
                    'on_hand_after' => $balance->on_hand_quantity,
                    'reserved_before' => $balance->reserved_quantity - $quantity,
                    'reserved_after' => $balance->reserved_quantity,
                    'pos_sale_item_id' => $item->id,
                    'performed_by_user_id' => $seller->id,
                ]);
            }

            return PaymentAttempt::query()->create([
                'sale_id' => $sale->id,
                'provider_code' => 'demo_bank',
                'idempotency_key' => (string) Str::uuid(),
                'amount' => $total,
                'qr_expires_at' => now()->addMinutes(20),
            ]);
        }, 3);

        $gatewayResponse = $this->gateway->requestPayment($paymentAttempt);
        $paymentAttempt->update([
            'provider_reference' => $gatewayResponse['provider_reference'],
            'qr_payload_encrypted' => $gatewayResponse['qr_payload'],
            'qr_expires_at' => $gatewayResponse['expires_at'],
        ]);

        return $paymentAttempt->fresh(['sale.posSale.items']);
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
