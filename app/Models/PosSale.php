<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'sale_number', 'cash_session_id', 'seller_user_id', 'customer_id', 'status', 'confirmed_at', 'cancelled_at', 'cancelled_by_user_id', 'cancellation_reason'])]
class PosSale extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['confirmed_at' => 'datetime', 'cancelled_at' => 'datetime'];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PosSaleItem::class);
    }
}
