<?php

declare(strict_types=1);

namespace App\Http\Requests\Events;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StorePromotionCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('events.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:80',
                Rule::unique('promotion_codes', 'code')->where('event_id', $this->route('event')->id),
            ],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'decimal:0,2', 'gt:0'],
            'minimum_amount' => ['nullable', 'decimal:0,2', 'min:0'],
            'maximum_discount' => ['nullable', 'decimal:0,2', 'gt:0'],
            'maximum_redemptions' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ];
    }
}
