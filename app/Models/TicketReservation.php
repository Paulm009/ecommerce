<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\ReservationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['event_occurrence_id', 'sale_id', 'customer_id', 'session_token_hash', 'status', 'selection_expires_at', 'payment_expires_at', 'confirmed_at', 'paid_at', 'expired_at', 'buyer_name', 'buyer_email', 'buyer_phone', 'buyer_identity_document', 'created_by_user_id'])]
class TicketReservation extends Model
{
    use HasUuidPrimary;

    protected $attributes = ['status' => 'temporary_selection'];

    protected function casts(): array
    {
        return ['status' => ReservationStatus::class, 'selection_expires_at' => 'datetime', 'payment_expires_at' => 'datetime', 'confirmed_at' => 'datetime', 'paid_at' => 'datetime', 'expired_at' => 'datetime'];
    }

    public function occurrence(): BelongsTo
    {
        return $this->belongsTo(EventOccurrence::class, 'event_occurrence_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TicketReservationItem::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(TicketReservationEvent::class);
    }
}
