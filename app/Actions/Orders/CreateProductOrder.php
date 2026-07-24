<?php

declare(strict_types=1);

namespace App\Actions\Orders;

use App\Contracts\Payments\QrPaymentGateway;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\PaymentAttempt;
use App\Models\ProductOrder;
use App\Models\ProductOrderItem;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\ShoppingCart;
use App\Models\ShoppingCartItem;
use App\Support\GeneratesPublicNumbers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateProductOrder
{
    public function __construct(
        private GeneratesPublicNumbers $numbers,
        private QrPaymentGateway $gateway,
    ) {}

    /**
     * @param  array{buyer_name: string, buyer_email?: string|null, buyer_phone?: string|null, buyer_identity_document?: string|null, items: array<int, array{product_variant_id: string, quantity: int}>}  $data
     */
    public function handle(Company $company, array $data, ?string $userId = null, ?string $sessionToken = null): PaymentAttempt
    {
        $paymentAttempt = DB::transaction(function () use ($company, $data, $userId, $sessionToken): PaymentAttempt {
            $settings = CompanySetting::query()->find($company->id);
            $paymentExpiresAt = now()->addMinutes($settings?->payment_reservation_minutes ?? 20);
            $cart = ShoppingCart::query()->create([
                'user_id' => $userId,
                'session_token_hash' => $sessionToken === null ? null : hash('sha256', $sessionToken),
                'currency_code' => $settings?->currency_code ?? 'BOB',
                'expires_at' => $paymentExpiresAt,
            ]);

            $preparedItems = collect($data['items'])
                ->sortBy('product_variant_id')
                ->map(function (array $requestedItem) use ($company, $cart): array {
                    $variant = ProductVariant::query()
                        ->with('product:id,company_id,name,status')
                        ->findOrFail($requestedItem['product_variant_id']);
                    $quantity = $requestedItem['quantity'];
                    $balance = InventoryBalance::query()->lockForUpdate()->findOrFail($variant->id);

                    if ($variant->product->company_id !== $company->id || ! $variant->is_active || $quantity < 1 || $balance->available_quantity < $quantity) {
                        throw ValidationException::withMessages(['items' => 'Uno de los productos no está disponible en la cantidad solicitada.']);
                    }

                    ShoppingCartItem::query()->create([
                        'shopping_cart_id' => $cart->id,
                        'product_variant_id' => $variant->id,
                        'quantity' => $quantity,
                        'unit_price_snapshot' => $variant->sale_price,
                    ]);

                    return ['variant' => $variant, 'balance' => $balance, 'quantity' => $quantity];
                });

            $subtotal = $this->sumMoney($preparedItems->map(fn (array $item): string => $this->multiplyMoney((string) $item['variant']->sale_price, $item['quantity']))->all());
            $sale = Sale::query()->create([
                'company_id' => $company->id,
                'public_number' => $this->numbers->next($company->id, 'product_order', 'PED'),
                'sale_type' => 'products',
                'channel' => 'web',
                'currency_code' => $settings?->currency_code ?? 'BOB',
                'subtotal_amount' => $subtotal,
                'total_amount' => $subtotal,
                'status' => 'pending_payment',
            ]);
            $order = ProductOrder::query()->create([
                'sale_id' => $sale->id,
                'shopping_cart_id' => $cart->id,
                'order_number' => $sale->public_number,
                'buyer_name' => $data['buyer_name'],
                'buyer_email' => $data['buyer_email'] ?? null,
                'buyer_phone' => $data['buyer_phone'] ?? null,
                'buyer_identity_document' => $data['buyer_identity_document'] ?? null,
                'payment_expires_at' => $paymentExpiresAt,
            ]);

            foreach ($preparedItems as $preparedItem) {
                $variant = $preparedItem['variant'];
                $balance = $preparedItem['balance'];
                $quantity = $preparedItem['quantity'];
                $lineTotal = $this->multiplyMoney((string) $variant->sale_price, $quantity);
                $costTotal = $this->multiplyMoney((string) $variant->purchase_cost, $quantity);
                $orderItem = ProductOrderItem::query()->create([
                    'product_order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'product_name_snapshot' => $variant->product->name,
                    'variant_name_snapshot' => $variant->name,
                    'sku_snapshot' => $variant->sku,
                    'quantity' => $quantity,
                    'unit_price' => $variant->sale_price,
                    'unit_cost' => $variant->purchase_cost,
                    'line_subtotal' => $lineTotal,
                    'line_total' => $lineTotal,
                    'cost_total' => $costTotal,
                    'profit_amount' => $this->subtractMoney($lineTotal, $costTotal),
                ]);
                $inventoryReservation = InventoryReservation::query()->create([
                    'product_order_item_id' => $orderItem->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'expires_at' => $paymentExpiresAt,
                ]);

                $balance->update([
                    'reserved_quantity' => $balance->reserved_quantity + $quantity,
                    'available_quantity' => $balance->available_quantity - $quantity,
                    'lock_version' => $balance->lock_version + 1,
                ]);
                InventoryMovement::query()->create([
                    'product_variant_id' => $variant->id,
                    'movement_type' => 'web_reservation',
                    'reserved_delta' => $quantity,
                    'on_hand_before' => $balance->on_hand_quantity,
                    'on_hand_after' => $balance->on_hand_quantity,
                    'reserved_before' => $balance->reserved_quantity - $quantity,
                    'reserved_after' => $balance->reserved_quantity,
                    'product_order_item_id' => $orderItem->id,
                    'inventory_reservation_id' => $inventoryReservation->id,
                ]);
            }

            return PaymentAttempt::query()->create([
                'sale_id' => $sale->id,
                'provider_code' => 'demo_bank',
                'idempotency_key' => (string) Str::uuid(),
                'amount' => $subtotal,
                'currency_code' => $settings?->currency_code ?? 'BOB',
                'qr_expires_at' => $paymentExpiresAt,
            ]);
        }, 3);

        $gatewayResponse = $this->gateway->requestPayment($paymentAttempt);
        $paymentAttempt->update([
            'provider_reference' => $gatewayResponse['provider_reference'],
            'qr_payload_encrypted' => $gatewayResponse['qr_payload'],
            'qr_expires_at' => $gatewayResponse['expires_at'],
        ]);

        return $paymentAttempt->fresh(['sale.productOrder.items']);
    }

    private function multiplyMoney(string $amount, int $quantity): string
    {
        return $this->centsToMoney($this->moneyToCents($amount) * $quantity);
    }

    /** @param array<int, string> $amounts */
    private function sumMoney(array $amounts): string
    {
        return $this->centsToMoney(array_sum(array_map($this->moneyToCents(...), $amounts)));
    }

    private function subtractMoney(string $amount, string $subtrahend): string
    {
        return $this->centsToMoney($this->moneyToCents($amount) - $this->moneyToCents($subtrahend));
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
