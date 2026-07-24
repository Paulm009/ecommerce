<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\EventStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['company_id', 'event_category_id', 'public_code', 'name', 'slug', 'short_description', 'description', 'venue_name', 'venue_address', 'city', 'latitude', 'longitude', 'status', 'published_at', 'cancelled_at', 'created_by_user_id', 'updated_by_user_id'])]
class Event extends Model
{
    use HasUuidPrimary, SoftDeletes;

    protected $attributes = ['status' => 'draft'];

    protected function casts(): array
    {
        return [
            'status' => EventStatus::class,
            'published_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', EventStatus::Published);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'event_category_id');
    }

    public function occurrences(): HasMany
    {
        return $this->hasMany(EventOccurrence::class);
    }
}
