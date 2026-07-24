<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'document_type', 'version', 'content', 'published_at', 'is_active', 'created_by_user_id'])]
class LegalDocument extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['published_at' => 'datetime', 'is_active' => 'boolean'];
    }
}
