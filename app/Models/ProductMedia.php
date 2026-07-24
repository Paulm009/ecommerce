<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['product_id', 'product_variant_id', 'media_asset_id', 'media_role', 'sort_order'])]
class ProductMedia extends Model
{
    use HasUuidPrimary;

    public const UPDATED_AT = null;
}
