<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['company_id', 'public_number', 'sale_type', 'channel', 'customer_id', 'created_by_user_id', 'currency_code', 'subtotal_amount', 'discount_amount', 'total_amount', 'status', 'paid_at', 'expired_at', 'cancelled_at', 'metadata_json'])]
class Sale extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['subtotal_amount' => 'decimal:2', 'discount_amount' => 'decimal:2', 'total_amount' => 'decimal:2', 'paid_at' => 'datetime', 'expired_at' => 'datetime', 'cancelled_at' => 'datetime', 'metadata_json' => 'array'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function paymentAttempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class);
    }

    public function ticketOrder(): HasOne
    {
        return $this->hasOne(TicketOrder::class);
    }

    public function productOrder(): HasOne
    {
        return $this->hasOne(ProductOrder::class);
    }

    public function posSale(): HasOne
    {
        return $this->hasOne(PosSale::class);
    }
}
