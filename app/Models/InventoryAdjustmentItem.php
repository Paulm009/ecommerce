<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['inventory_adjustment_id', 'product_variant_id', 'quantity_delta', 'unit_cost', 'notes'])]
class InventoryAdjustmentItem extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['unit_cost' => 'decimal:2'];
    }
}
