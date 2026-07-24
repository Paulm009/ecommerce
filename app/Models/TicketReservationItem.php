<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ticket_reservation_id', 'ticket_type_id', 'event_location_id', 'quantity', 'unit_price_snapshot', 'line_subtotal', 'status'])]
class TicketReservationItem extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['unit_price_snapshot' => 'decimal:2', 'line_subtotal' => 'decimal:2'];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(TicketReservation::class, 'ticket_reservation_id');
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(EventLocation::class, 'event_location_id');
    }
}
