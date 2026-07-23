<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['payment_incident_id', 'payment_attempt_id', 'amount', 'status', 'reason', 'approved_by_user_id', 'completed_by_user_id', 'external_reference', 'proof_media_id', 'requested_at', 'completed_at', 'notes'])]
class ManualRefund extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'requested_at' => 'datetime', 'completed_at' => 'datetime'];
    }
}
