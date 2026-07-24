<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['product_order_id', 'product_variant_id', 'product_name_snapshot', 'variant_name_snapshot', 'sku_snapshot', 'quantity', 'unit_price', 'unit_cost', 'line_subtotal', 'discount_amount', 'line_total', 'cost_total', 'profit_amount'])]
class ProductOrderItem extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'unit_cost' => 'decimal:2', 'line_subtotal' => 'decimal:2', 'discount_amount' => 'decimal:2', 'line_total' => 'decimal:2', 'cost_total' => 'decimal:2', 'profit_amount' => 'decimal:2'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(ProductOrder::class, 'product_order_id');
    }

    public function reservation(): HasOne
    {
        return $this->hasOne(InventoryReservation::class);
    }
}
