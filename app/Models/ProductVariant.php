<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['product_id', 'name', 'sku', 'barcode', 'sale_price', 'purchase_cost', 'low_stock_threshold', 'attributes_json', 'is_default', 'is_active', 'sort_order'])]
class ProductVariant extends Model
{
    use HasUuidPrimary, SoftDeletes;

    protected function casts(): array
    {
        return ['sale_price' => 'decimal:2', 'purchase_cost' => 'decimal:2', 'attributes_json' => 'array', 'is_default' => 'boolean', 'is_active' => 'boolean'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(InventoryBalance::class);
    }
}
