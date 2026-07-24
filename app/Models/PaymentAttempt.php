<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'provider_code', 'provider_reference', 'provider_transaction_id', 'idempotency_key', 'amount', 'currency_code', 'status', 'qr_payload_encrypted', 'qr_expires_at', 'requested_at', 'confirmed_at', 'last_checked_at', 'failure_code', 'failure_message'])]
#[Hidden(['qr_payload_encrypted'])]
class PaymentAttempt extends Model
{
    use HasUuidPrimary;

    protected $attributes = ['status' => 'pending'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'status' => PaymentStatus::class, 'qr_payload_encrypted' => 'encrypted', 'qr_expires_at' => 'datetime', 'requested_at' => 'datetime', 'confirmed_at' => 'datetime', 'last_checked_at' => 'datetime'];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(PaymentEvent::class);
    }
}
