<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['promotion_code_id', 'sale_id', 'customer_id', 'discount_amount', 'status', 'consumed_at'])]
class PromotionRedemption extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['discount_amount' => 'decimal:2', 'consumed_at' => 'datetime'];
    }
}
