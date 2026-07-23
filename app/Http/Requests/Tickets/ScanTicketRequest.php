<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;

final class ScanTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('access.scan') ?? false;
    }

    public function rules(): array
    {
        return ['token' => ['required', 'string', 'max:500']];
    }
}
