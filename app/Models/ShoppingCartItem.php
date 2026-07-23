<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['shopping_cart_id', 'product_variant_id', 'quantity', 'unit_price_snapshot'])]
class ShoppingCartItem extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['unit_price_snapshot' => 'decimal:2'];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
