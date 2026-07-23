<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_variant_id', 'on_hand_quantity', 'reserved_quantity', 'available_quantity', 'lock_version'])]
class InventoryBalance extends Model
{
    protected $primaryKey = 'product_variant_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public const CREATED_AT = null;

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
