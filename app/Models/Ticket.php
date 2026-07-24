<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['event_occurrence_id', 'ticket_order_id', 'courtesy_batch_id', 'public_code', 'qr_token_hash', 'status', 'quota_total', 'quota_used', 'recipient_name', 'recipient_email', 'issued_at', 'voided_at', 'voided_by_user_id', 'void_reason', 'last_sent_at'])]
#[Hidden(['qr_token_hash'])]
class Ticket extends Model
{
    use HasUuidPrimary;

    protected $attributes = ['status' => 'active'];

    protected function casts(): array
    {
        return ['status' => TicketStatus::class, 'issued_at' => 'datetime', 'voided_at' => 'datetime', 'last_sent_at' => 'datetime'];
    }

    public function occurrence(): BelongsTo
    {
        return $this->belongsTo(EventOccurrence::class, 'event_occurrence_id');
    }

    public function entitlements(): HasMany
    {
        return $this->hasMany(TicketEntitlement::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(AccessScan::class);
    }
}
