<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['pos_sale_id', 'product_variant_id', 'product_name_snapshot', 'variant_name_snapshot', 'sku_snapshot', 'quantity', 'unit_price', 'unit_cost', 'line_total', 'cost_total', 'profit_amount'])]
class PosSaleItem extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'unit_cost' => 'decimal:2', 'line_total' => 'decimal:2', 'cost_total' => 'decimal:2', 'profit_amount' => 'decimal:2'];
    }
}
