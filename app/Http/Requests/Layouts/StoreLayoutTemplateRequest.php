<?php

declare(strict_types=1);

namespace App\Http\Requests\Layouts;

use Illuminate\Foundation\Http\FormRequest;

final class StoreLayoutTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('layouts.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:180'],
            'layout_file' => ['required', 'file', 'mimes:json', 'mimetypes:application/json,text/plain', 'max:2048'],
        ];
    }
}
