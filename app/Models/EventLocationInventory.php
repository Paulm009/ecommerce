<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['event_location_id', 'capacity_total', 'blocked_quantity', 'selection_quantity', 'payment_reserved_quantity', 'sold_quantity', 'courtesy_quantity', 'available_quantity', 'lock_version'])]
class EventLocationInventory extends Model
{
    protected $table = 'event_location_inventory';

    protected $primaryKey = 'event_location_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public const CREATED_AT = null;

    public function location(): BelongsTo
    {
        return $this->belongsTo(EventLocation::class, 'event_location_id');
    }
}
