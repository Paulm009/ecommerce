<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'actor_user_id', 'action', 'entity_type', 'entity_id', 'before_json', 'after_json', 'reason', 'ip_address', 'user_agent', 'request_id'])]
class AuditLog extends Model
{
    use HasUuidPrimary;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['before_json' => 'array', 'after_json' => 'array', 'created_at' => 'datetime'];
    }
}
