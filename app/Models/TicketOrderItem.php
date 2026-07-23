<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ticket_order_id', 'ticket_type_id', 'event_location_id', 'ticket_type_name_snapshot', 'location_label_snapshot', 'location_external_key_snapshot', 'quantity', 'unit_price', 'discount_amount', 'line_total'])]
class TicketOrderItem extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'discount_amount' => 'decimal:2', 'line_total' => 'decimal:2'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(TicketOrder::class, 'ticket_order_id');
    }
}
