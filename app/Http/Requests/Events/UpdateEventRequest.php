<?php

declare(strict_types=1);

namespace App\Http\Requests\Events;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateEventRequest extends FormRequest
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
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'venue_name' => ['required', 'string', 'max:220'],
            'venue_address' => ['nullable', 'string', 'max:300'],
            'city' => ['nullable', 'string', 'max:120'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'sales_start_at' => ['nullable', 'date'],
            'sales_end_at' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'published', 'finished', 'cancelled'])],
            'ticket_types' => ['sometimes', 'array', 'min:1'],
            'ticket_types.*.id' => ['nullable', 'string'],
            'ticket_types.*.name' => ['required_with:ticket_types', 'string', 'max:160'],
            'ticket_types.*.code' => ['required_with:ticket_types', 'string', 'max:80', 'distinct'],
            'ticket_types.*.description' => ['nullable', 'string'],
            'ticket_types.*.base_price' => ['required_with:ticket_types', 'decimal:0,2', 'min:0'],
            'ticket_types.*.quota_total' => ['required_with:ticket_types', 'integer', 'min:1'],
            'ticket_types.*.minimum_per_order' => ['nullable', 'integer', 'min:1'],
            'ticket_types.*.maximum_per_order' => ['nullable', 'integer', 'min:1'],
            'ticket_types.*.sales_start_at' => ['nullable', 'date'],
            'ticket_types.*.sales_end_at' => ['nullable', 'date'],
            'ticket_types.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}
