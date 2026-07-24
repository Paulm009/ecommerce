<?php

declare(strict_types=1);

namespace App\Actions\Inventory;

use App\Jobs\SendLowStockAlertEmail;
use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentItem;
use App\Models\InventoryBalance;
use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use App\Models\StockAlert;
use App\Models\User;
use App\Support\GeneratesPublicNumbers;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdjustInventory
{
    public function __construct(private GeneratesPublicNumbers $numbers) {}

    public function handle(ProductVariant $variant, int $quantityDelta, string $reason, User $user, string $adjustmentType = 'manual'): InventoryAdjustment
    {
        $adjustment = DB::transaction(function () use ($variant, $quantityDelta, $reason, $user, $adjustmentType): InventoryAdjustment {
            $variant->loadMissing('product');
            $balance = InventoryBalance::query()->lockForUpdate()->findOrFail($variant->id);
            $newOnHand = $balance->on_hand_quantity + $quantityDelta;
            $newAvailable = $newOnHand - $balance->reserved_quantity;

            if ($newOnHand < 0 || $newAvailable < 0) {
                throw ValidationException::withMessages(['quantity_delta' => 'El ajuste no puede dejar stock negativo ni afectar unidades reservadas.']);
            }

            $adjustment = InventoryAdjustment::query()->create([
                'adjustment_number' => $this->numbers->next($variant->product->company_id, 'inventory_adjustment', 'AJU'),
                'adjustment_type' => $adjustmentType,
                'reason' => $reason,
                'status' => 'confirmed',
                'created_by_user_id' => $user->id,
                'confirmed_by_user_id' => $user->id,
                'confirmed_at' => now(),
            ]);
            $item = InventoryAdjustmentItem::query()->create([
                'inventory_adjustment_id' => $adjustment->id,
                'product_variant_id' => $variant->id,
                'quantity_delta' => $quantityDelta,
                'unit_cost' => $variant->purchase_cost,
            ]);
            $onHandBefore = $balance->on_hand_quantity;
            $reservedBefore = $balance->reserved_quantity;
            $balance->update([
                'on_hand_quantity' => $newOnHand,
                'available_quantity' => $newAvailable,
                'lock_version' => $balance->lock_version + 1,
            ]);
            InventoryMovement::query()->create([
                'product_variant_id' => $variant->id,
                'movement_type' => 'adjustment',
                'on_hand_delta' => $quantityDelta,
                'on_hand_before' => $onHandBefore,
                'on_hand_after' => $newOnHand,
                'reserved_before' => $reservedBefore,
                'reserved_after' => $reservedBefore,
                'inventory_adjustment_item_id' => $item->id,
                'performed_by_user_id' => $user->id,
                'reason' => $reason,
            ]);

            if ($newAvailable <= $variant->low_stock_threshold) {
                StockAlert::query()->firstOrCreate(
                    ['product_variant_id' => $variant->id, 'status' => 'open'],
                    ['alert_type' => $newAvailable === 0 ? 'out_of_stock' : 'low_stock', 'quantity_at_open' => $newAvailable],
                );
            } else {
                StockAlert::query()
                    ->where('product_variant_id', $variant->id)
                    ->where('status', 'open')
                    ->update(['status' => 'resolved', 'resolved_at' => now()]);
            }

            return $adjustment->load('items');
        }, 3);

        SendLowStockAlertEmail::dispatch($variant->id);

        return $adjustment;
    }
}
