<?php

declare(strict_types=1);

namespace App\Http\Requests\Orders;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class CreateProductOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $guest = $this->user() === null;

        return [
            'buyer_name' => ['required', 'string', 'max:180'],
            'buyer_email' => $guest
                ? ['required', 'email', 'max:180', Rule::unique(User::class, 'email')]
                : ['required', 'email', 'max:180'],
            'buyer_phone' => ['required', 'string', 'max:40'],
            'buyer_identity_document' => ['required', 'string', 'max:80'],
            'session_token' => ['nullable', 'string', 'min:20', 'max:180'],
            'password' => $guest
                ? ['required', 'string', Password::default(), 'confirmed']
                : ['nullable', 'string'],
            'password_confirmation' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'uuid', Rule::exists('product_variants', 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}
