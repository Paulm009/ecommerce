<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_location_id', 'ticket_type_id', 'movement_type', 'quantity', 'from_bucket', 'to_bucket', 'reservation_item_id', 'ticket_order_item_id', 'courtesy_item_id', 'location_block_id', 'performed_by_user_id', 'metadata_json'])]
class EventInventoryMovement extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['metadata_json' => 'array'];
    }
}
