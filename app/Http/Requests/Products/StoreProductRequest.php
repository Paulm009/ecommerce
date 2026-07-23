<?php

declare(strict_types=1);

namespace App\Http\Requests\Products;

use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('products.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:220'],
            'description' => ['nullable', 'string'],
            'product_type' => ['required', Rule::in(['simple', 'variant'])],
            'status' => ['required', Rule::in(['draft', 'published', 'inactive'])],
            'is_featured' => ['boolean'],
            'hide_when_out_of_stock' => ['boolean'],
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['uuid', Rule::exists('product_categories', 'id')->where('is_active', true)],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.name' => ['nullable', 'string', 'max:180'],
            'variants.*.sku' => ['required', 'string', 'max:100', 'distinct', Rule::unique((new ProductVariant)->getTable(), 'sku')],
            'variants.*.barcode' => ['nullable', 'string', 'max:120', 'distinct'],
            'variants.*.sale_price' => ['required', 'decimal:0,2', 'min:0'],
            'variants.*.purchase_cost' => ['required', 'decimal:0,2', 'min:0'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.low_stock_threshold' => ['required', 'integer', 'min:0'],
        ];
    }
}
