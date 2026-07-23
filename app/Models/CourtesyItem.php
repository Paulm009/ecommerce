<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['courtesy_batch_id', 'ticket_type_id', 'event_location_id', 'quantity', 'ticket_type_name_snapshot', 'location_label_snapshot'])]
class CourtesyItem extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    public function batch(): BelongsTo
    {
        return $this->belongsTo(CourtesyBatch::class, 'courtesy_batch_id');
    }
}
