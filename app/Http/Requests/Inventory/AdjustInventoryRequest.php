<?php

declare(strict_types=1);

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class AdjustInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('inventory.adjust') ?? false;
    }

    public function rules(): array
    {
        return [
            'product_variant_id' => ['required', 'uuid', Rule::exists('product_variants', 'id')],
            'quantity_delta' => ['required', 'integer', 'not_in:0'],
            'adjustment_type' => ['required', Rule::in(['entry', 'exit', 'correction', 'manual'])],
            'reason' => ['required', 'string', 'max:2000'],
        ];
    }
}
