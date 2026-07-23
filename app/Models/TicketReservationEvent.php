<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ticket_reservation_id', 'event_type', 'previous_status', 'new_status', 'performed_by_user_id', 'payment_attempt_id', 'metadata_json'])]
class TicketReservationEvent extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['metadata_json' => 'array'];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(TicketReservation::class, 'ticket_reservation_id');
    }
}
