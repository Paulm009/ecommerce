<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['payment_attempt_id', 'provider_code', 'provider_event_id', 'event_source', 'event_type', 'signature_valid', 'raw_payload', 'received_at', 'processed_at', 'processing_status', 'processing_message'])]
class PaymentEvent extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['signature_valid' => 'boolean', 'raw_payload' => 'array', 'received_at' => 'datetime', 'processed_at' => 'datetime'];
    }

    public function paymentAttempt(): BelongsTo
    {
        return $this->belongsTo(PaymentAttempt::class);
    }
}
