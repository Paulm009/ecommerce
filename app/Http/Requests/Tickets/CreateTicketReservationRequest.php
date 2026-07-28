<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateTicketReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_token' => ['required', 'string', 'min:20', 'max:180'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.event_location_id' => ['required', 'uuid', Rule::exists('event_locations', 'id')],
            'items.*.ticket_type_id' => ['sometimes', 'nullable', 'uuid', Rule::exists('ticket_types', 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ];
    }
}
