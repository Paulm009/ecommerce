<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['customer_id', 'user_id', 'session_token_hash', 'status', 'currency_code', 'expires_at'])]
class ShoppingCart extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(ShoppingCartItem::class);
    }
}
