<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['adjustment_number', 'adjustment_type', 'reason', 'status', 'created_by_user_id', 'confirmed_by_user_id', 'confirmed_at'])]
class InventoryAdjustment extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    public function items(): HasMany
    {
        return $this->hasMany(InventoryAdjustmentItem::class);
    }
}
