<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_occurrence_id', 'user_id', 'assignment_type', 'active_from', 'active_until', 'assigned_by_user_id'])]
class EventStaffAssignment extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['active_from' => 'datetime', 'active_until' => 'datetime'];
    }
}
