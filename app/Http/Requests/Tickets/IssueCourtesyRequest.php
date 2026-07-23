<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IssueCourtesyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('tickets.issue_courtesy') ?? false;
    }

    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:180'],
            'recipient_email' => ['nullable', 'email', 'max:180'],
            'recipient_phone' => ['nullable', 'string', 'max:40'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.event_location_id' => ['required', 'uuid', Rule::exists('event_locations', 'id')],
            'items.*.ticket_type_id' => ['required', 'uuid', Rule::exists('ticket_types', 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}
