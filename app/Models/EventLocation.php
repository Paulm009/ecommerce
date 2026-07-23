<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['event_layout_id', 'template_node_id', 'parent_id', 'external_key', 'location_type', 'label', 'capacity_total', 'is_selectable', 'is_visible', 'is_enabled', 'sale_mode', 'geometry_json', 'style_json', 'metadata_json'])]
class EventLocation extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['is_selectable' => 'boolean', 'is_visible' => 'boolean', 'is_enabled' => 'boolean', 'geometry_json' => 'array', 'style_json' => 'array', 'metadata_json' => 'array'];
    }

    public function layout(): BelongsTo
    {
        return $this->belongsTo(EventLayout::class, 'event_layout_id');
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(EventLocationInventory::class);
    }

    public function ticketTypes(): BelongsToMany
    {
        return $this->belongsToMany(TicketType::class, 'event_location_ticket_types')->withPivot(['price_override', 'is_active']);
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
