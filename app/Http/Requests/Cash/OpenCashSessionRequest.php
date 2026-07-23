<?php

declare(strict_types=1);

namespace App\Http\Requests\Cash;

use Illuminate\Foundation\Http\FormRequest;

final class OpenCashSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('cash.manage') ?? false;
    }

    public function rules(): array
    {
        return ['opening_amount' => ['required', 'decimal:0,2', 'min:0']];
    }
}
