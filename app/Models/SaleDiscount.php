<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['sale_id', 'promotion_code_id', 'description', 'discount_type_snapshot', 'discount_value_snapshot', 'discount_amount'])]
class SaleDiscount extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['discount_value_snapshot' => 'decimal:2', 'discount_amount' => 'decimal:2'];
    }
}
