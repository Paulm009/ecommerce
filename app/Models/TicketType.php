<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['event_occurrence_id', 'name', 'description', 'code', 'base_price', 'quota_total', 'minimum_per_order', 'maximum_per_order', 'sales_start_at', 'sales_end_at', 'is_active', 'sort_order'])]
class TicketType extends Model
{
    use HasUuidPrimary, SoftDeletes;

    protected function casts(): array
    {
        return ['base_price' => 'decimal:2', 'sales_start_at' => 'datetime', 'sales_end_at' => 'datetime', 'is_active' => 'boolean'];
    }

    public function occurrence(): BelongsTo
    {
        return $this->belongsTo(EventOccurrence::class, 'event_occurrence_id');
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(TicketTypeInventory::class);
    }

    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(EventLocation::class, 'event_location_ticket_types')->withPivot(['price_override', 'is_active']);
    }
}
