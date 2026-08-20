<?php

declare(strict_types=1);

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateProductOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $guestRule = $this->user() ? 'nullable' : 'required';

        return [
            'buyer_name' => ['required', 'string', 'max:180'],
            'buyer_email' => [$guestRule, 'email', 'max:180'],
            'buyer_phone' => [$guestRule, 'string', 'max:40'],
            'buyer_identity_document' => ['nullable', 'string', 'max:80'],
            'session_token' => ['nullable', 'string', 'min:20', 'max:180'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'uuid', Rule::exists('product_variants', 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}
