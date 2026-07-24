<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_id', 'code', 'discount_type', 'discount_value', 'minimum_amount', 'maximum_discount', 'maximum_redemptions', 'maximum_per_customer', 'starts_at', 'ends_at', 'is_active', 'created_by_user_id'])]
class PromotionCode extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['discount_value' => 'decimal:2', 'minimum_amount' => 'decimal:2', 'maximum_discount' => 'decimal:2', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_active' => 'boolean'];
    }
}
