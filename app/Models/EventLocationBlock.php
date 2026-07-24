<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_location_id', 'quantity', 'block_type', 'reason', 'status', 'blocked_by_user_id', 'released_by_user_id', 'blocked_at', 'released_at'])]
class EventLocationBlock extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['blocked_at' => 'datetime', 'released_at' => 'datetime'];
    }
}
