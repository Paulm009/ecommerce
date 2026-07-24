<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ticket_id', 'ticket_order_item_id', 'courtesy_item_id', 'ticket_type_id', 'event_location_id', 'quantity'])]
class TicketEntitlement extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
