<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['layout_template_id', 'parent_id', 'external_key', 'node_type', 'label', 'capacity', 'is_selectable', 'sale_mode', 'geometry_json', 'style_json', 'metadata_json', 'sort_order'])]
class LayoutTemplateNode extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['is_selectable' => 'boolean', 'geometry_json' => 'array', 'style_json' => 'array', 'metadata_json' => 'array'];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(LayoutTemplate::class, 'layout_template_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
