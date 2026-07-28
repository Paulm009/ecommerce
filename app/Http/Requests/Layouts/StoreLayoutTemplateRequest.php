<?php

declare(strict_types=1);

namespace App\Http\Requests\Layouts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreLayoutTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('layouts.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'mode' => ['required', Rule::in(['create', 'import'])],
            'name' => ['required', 'string', 'max:180'],
            'template_type' => ['required_if:mode,create', Rule::in(['sectors', 'matrix', 'mixed'])],
            'layout_file' => ['required_if:mode,import', 'file', 'mimes:json', 'mimetypes:application/json,text/plain', 'max:2048'],
            'sectors' => ['required_if:template_type,sectors', 'array', 'min:1'],
            'sectors.*.key' => ['required_with:sectors', 'string', 'max:140'],
            'sectors.*.label' => ['required_with:sectors', 'string', 'max:150'],
            'sectors.*.price' => ['required_with:sectors', 'numeric', 'min:0'],
            'sectors.*.capacity' => ['required_with:sectors', 'integer', 'min:1'],
            'sectors.*.color' => ['nullable', 'string', 'max:30'],
            'matrix' => ['required_if:template_type,matrix', 'array'],
            'matrix.rows' => ['required_if:template_type,matrix', 'integer', 'min:1', 'max:50'],
            'matrix.columns' => ['required_if:template_type,matrix', 'integer', 'min:1', 'max:50'],
            'matrix.price' => ['required_if:template_type,matrix', 'numeric', 'min:0'],
            'matrix.disabled_cells' => ['sometimes', 'array'],
            'matrix.disabled_cells.*' => ['string', 'regex:/^\d+-\d+$/'],
            'mixed' => ['required_if:template_type,mixed', 'array'],
            'mixed.sectors' => ['required_if:template_type,mixed', 'array', 'min:1'],
            'mixed.sectors.*.key' => ['required_with:mixed.sectors', 'string', 'max:140'],
            'mixed.sectors.*.label' => ['required_with:mixed.sectors', 'string', 'max:150'],
            'mixed.sectors.*.price' => ['required_with:mixed.sectors', 'numeric', 'min:0'],
            'mixed.sectors.*.color' => ['nullable', 'string', 'max:30'],
            'mixed.sectors.*.tables' => ['required_with:mixed.sectors', 'array', 'min:1'],
            'mixed.sectors.*.tables.*.key' => ['required_with:mixed.sectors.*.tables', 'string', 'max:140'],
            'mixed.sectors.*.tables.*.label' => ['required_with:mixed.sectors.*.tables', 'string', 'max:150'],
            'mixed.sectors.*.tables.*.chairs' => ['required_with:mixed.sectors.*.tables', 'integer', 'min:1', 'max:50'],
        ];
    }
}
