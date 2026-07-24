<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;

final class ConfirmTicketReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'buyer_name' => ['required', 'string', 'max:180'],
            'buyer_email' => ['required', 'email', 'max:180'],
            'buyer_phone' => ['required', 'string', 'max:40'],
            'buyer_identity_document' => ['required', 'string', 'max:80'],
            'promotion_code' => ['nullable', 'string', 'max:80'],
        ];
    }
}
