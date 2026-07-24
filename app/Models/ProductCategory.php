<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['company_id', 'parent_id', 'name', 'slug', 'description', 'sort_order', 'is_visible', 'is_active'])]
class ProductCategory extends Model
{
    use HasUuidPrimary, SoftDeletes;

    protected function casts(): array
    {
        return ['is_visible' => 'boolean', 'is_active' => 'boolean'];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_category_links')->withPivot('is_primary');
    }
}
