<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sale_id', 'payment_attempt_id', 'ticket_reservation_id', 'incident_type', 'status', 'expected_amount', 'received_amount', 'description', 'assigned_to_user_id', 'opened_at', 'resolved_at', 'resolution_notes'])]
class PaymentIncident extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['expected_amount' => 'decimal:2', 'received_amount' => 'decimal:2', 'opened_at' => 'datetime', 'resolved_at' => 'datetime'];
    }

    public function paymentAttempt(): BelongsTo
    {
        return $this->belongsTo(PaymentAttempt::class);
    }
}
