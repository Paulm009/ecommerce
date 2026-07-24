<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_variant_id', 'movement_type', 'on_hand_delta', 'reserved_delta', 'on_hand_before', 'on_hand_after', 'reserved_before', 'reserved_after', 'product_order_item_id', 'pos_sale_item_id', 'inventory_reservation_id', 'inventory_adjustment_item_id', 'performed_by_user_id', 'reason'])]
class InventoryMovement extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
