<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\ProductStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['company_id', 'name', 'slug', 'description', 'product_type', 'status', 'is_featured', 'hide_when_out_of_stock', 'published_at', 'created_by_user_id', 'updated_by_user_id'])]
class Product extends Model
{
    use HasUuidPrimary, SoftDeletes;

    protected $attributes = ['status' => 'draft'];

    protected function casts(): array
    {
        return ['status' => ProductStatus::class, 'is_featured' => 'boolean', 'hide_when_out_of_stock' => 'boolean', 'published_at' => 'datetime'];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Published);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(ProductCategory::class, 'product_category_links')->withPivot('is_primary');
    }
}
