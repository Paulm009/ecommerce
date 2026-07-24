<?php

declare(strict_types=1);

namespace App\Http\Requests\Events;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('events.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:220'],
            'event_category_id' => ['nullable', Rule::exists('event_categories', 'id')->where('is_active', true)],
            'layout_template_id' => ['required', Rule::exists('layout_templates', 'id')->where('status', 'active')],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'venue_name' => ['required', 'string', 'max:220'],
            'venue_address' => ['nullable', 'string', 'max:300'],
            'city' => ['nullable', 'string', 'max:120'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'sales_start_at' => ['nullable', 'date'],
            'sales_end_at' => ['nullable', 'date', 'after:sales_start_at'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'ticket_types' => ['required', 'array', 'min:1'],
            'ticket_types.*.name' => ['required', 'string', 'max:160'],
            'ticket_types.*.code' => ['required', 'string', 'max:80', 'distinct'],
            'ticket_types.*.base_price' => ['required', 'decimal:0,2', 'min:0'],
            'ticket_types.*.quota_total' => ['required', 'integer', 'min:1'],
        ];
    }
}
