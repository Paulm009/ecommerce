<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['aggregate_type', 'aggregate_id', 'event_type', 'payload_json', 'status', 'available_at', 'processed_at', 'attempts', 'last_error'])]
class OutboxEvent extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['payload_json' => 'array', 'available_at' => 'datetime', 'processed_at' => 'datetime', 'created_at' => 'datetime'];
    }
}
