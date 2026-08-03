<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['company_id', 'name', 'template_type', 'version', 'schema_version', 'source_media_id', 'source_json', 'checksum_sha256', 'status', 'validation_status', 'validation_errors', 'created_by_user_id'])]
class LayoutTemplate extends Model
{
    use HasUuidPrimary, SoftDeletes;

    protected function casts(): array
    {
        return ['source_json' => 'array', 'validation_errors' => 'array'];
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(LayoutTemplateNode::class)->orderBy('sort_order');
    }
}
