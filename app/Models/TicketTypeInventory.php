<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ticket_type_id', 'quota_total', 'selection_quantity', 'payment_reserved_quantity', 'sold_quantity', 'courtesy_quantity', 'available_quantity', 'lock_version'])]
class TicketTypeInventory extends Model
{
    protected $table = 'ticket_type_inventory';

    protected $primaryKey = 'ticket_type_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public const CREATED_AT = null;

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }
}
