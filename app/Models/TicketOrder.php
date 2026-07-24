<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'ticket_reservation_id', 'event_occurrence_id', 'order_number', 'buyer_name', 'buyer_email', 'buyer_phone', 'buyer_identity_document', 'event_name_snapshot', 'occurrence_starts_at_snapshot', 'status', 'cancelled_at', 'cancelled_by_user_id', 'cancellation_reason'])]
class TicketOrder extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['occurrence_starts_at_snapshot' => 'datetime', 'cancelled_at' => 'datetime'];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TicketOrderItem::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
