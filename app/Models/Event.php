<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\EventStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

#[Fillable(['company_id', 'event_category_id', 'public_code', 'name', 'slug', 'short_description', 'description', 'venue_name', 'venue_address', 'city', 'latitude', 'longitude', 'status', 'published_at', 'cancelled_at', 'created_by_user_id', 'updated_by_user_id'])]
class Event extends Model
{
    use HasUuidPrimary, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $appends = ['cover_image_url'];

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

    /**
     * @return BelongsToMany<MediaAsset>
     */
    public function mediaAssets(): BelongsToMany
    {
        return $this->belongsToMany(MediaAsset::class, 'event_media')
            ->withPivot(['media_role', 'sort_order'])
            ->orderBy('event_media.sort_order');
    }

    /**
     * @return BelongsToMany<MediaAsset>
     */
    public function coverMedia(): BelongsToMany
    {
        return $this->mediaAssets()->wherePivot('media_role', 'cover');
    }

    protected function coverImageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            $coverMedia = $this->coverMedia->first();

            if ($coverMedia === null) {
                return null;
            }

            return Storage::disk($coverMedia->disk)->url($coverMedia->path);
        });
    }
}
