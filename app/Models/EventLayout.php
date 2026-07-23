<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['event_occurrence_id', 'layout_template_id', 'template_version', 'snapshot_json', 'status', 'activated_at', 'created_by_user_id'])]
class EventLayout extends Model
{
    use HasUuidPrimary;

    protected function casts(): array
    {
        return ['snapshot_json' => 'array', 'activated_at' => 'datetime'];
    }

    public function occurrence(): BelongsTo
    {
        return $this->belongsTo(EventOccurrence::class, 'event_occurrence_id');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(EventLocation::class);
    }
}
