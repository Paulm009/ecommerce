<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Layouts\StoreLayoutTemplateRequest;
use App\Models\LayoutTemplate;
use App\Models\LayoutTemplateNode;
use App\Models\MediaAsset;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use JsonException;

final class LayoutController extends Controller
{
    public function index(CurrentCompany $currentCompany): Response
    {
        return Inertia::render('admin/layouts/index', [
            'layouts' => LayoutTemplate::query()->withCount('nodes')->where('company_id', $currentCompany->get()->id)->latest()->paginate(20),
        ]);
    }

    public function store(StoreLayoutTemplateRequest $request, CurrentCompany $currentCompany): RedirectResponse
    {
        $file = $request->file('layout_file');

        try {
            $source = json_decode($file->getContent(), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw ValidationException::withMessages(['layout_file' => 'El archivo no contiene JSON válido.']);
        }

        if (! is_array($source) || ! isset($source['nodes']) || ! is_array($source['nodes']) || $source['nodes'] === []) {
            throw ValidationException::withMessages(['layout_file' => 'El plano debe contener un arreglo nodes con al menos una ubicación.']);
        }

        DB::transaction(function () use ($request, $currentCompany, $file, $source): void {
            $path = $file->store('layouts');
            $media = MediaAsset::query()->create([
                'company_id' => $currentCompany->get()->id,
                'disk' => 'local',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType() ?? 'application/json',
                'size_bytes' => $file->getSize(),
                'checksum_sha256' => hash('sha256', $file->getContent()),
                'uploaded_by_user_id' => $request->user()->id,
            ]);
            $version = (int) LayoutTemplate::query()->where('company_id', $currentCompany->get()->id)->where('name', $request->string('name'))->max('version') + 1;
            $template = LayoutTemplate::query()->create([
                'company_id' => $currentCompany->get()->id,
                'name' => $request->string('name')->toString(),
                'version' => $version,
                'schema_version' => (string) ($source['schema_version'] ?? '1.0'),
                'source_media_id' => $media->id,
                'source_json' => $source,
                'checksum_sha256' => hash('sha256', $file->getContent()),
                'validation_status' => 'valid',
                'created_by_user_id' => $request->user()->id,
            ]);
            $nodeIds = [];

            foreach ($source['nodes'] as $index => $node) {
                if (! is_array($node) || empty($node['key']) || empty($node['type'])) {
                    throw ValidationException::withMessages(['layout_file' => 'Cada nodo requiere key y type.']);
                }

                $createdNode = LayoutTemplateNode::query()->create([
                    'layout_template_id' => $template->id,
                    'parent_id' => isset($node['parent']) ? ($nodeIds[$node['parent']] ?? null) : null,
                    'external_key' => (string) $node['key'],
                    'node_type' => (string) $node['type'],
                    'label' => $node['label'] ?? null,
                    'capacity' => max(1, (int) ($node['capacity'] ?? 1)),
                    'is_selectable' => (bool) ($node['selectable'] ?? true),
                    'sale_mode' => (string) ($node['sale_mode'] ?? 'individual'),
                    'geometry_json' => $node['geometry'] ?? [],
                    'style_json' => $node['style'] ?? [],
                    'metadata_json' => $node['metadata'] ?? [],
                    'sort_order' => $index,
                ]);
                $nodeIds[(string) $node['key']] = $createdNode->id;
            }
        }, 3);

        return back()->with('success', 'Plantilla de plano importada.');
    }

    public function toggle(LayoutTemplate $layoutTemplate): RedirectResponse
    {
        $layoutTemplate->update(['status' => $layoutTemplate->status === 'active' ? 'inactive' : 'active']);

        return back()->with('success', 'Estado del plano actualizado.');
    }
}
