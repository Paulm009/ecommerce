<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['event_occurrence_id', 'public_number', 'recipient_name', 'recipient_email', 'recipient_phone', 'reason', 'status', 'issued_by_user_id', 'issued_at', 'cancelled_by_user_id', 'cancelled_at'])]
class CourtesyBatch extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['issued_at' => 'datetime', 'cancelled_at' => 'datetime'];
    }

    public function occurrence(): BelongsTo
    {
        return $this->belongsTo(EventOccurrence::class, 'event_occurrence_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CourtesyItem::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
