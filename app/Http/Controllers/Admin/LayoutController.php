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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use JsonException;

final class LayoutController extends Controller
{
    public function index(CurrentCompany $currentCompany): Response
    {
        return Inertia::render('admin/layouts/index', [
            'layouts' => LayoutTemplate::query()
                ->withCount('nodes')
                ->with([
                    'nodes:id,layout_template_id,parent_id,external_key,node_type,label,capacity,is_selectable,sale_mode,geometry_json,style_json,metadata_json,sort_order',
                ])
                ->where('company_id', $currentCompany->get()->id)
                ->latest()
                ->paginate(20),
        ]);
    }

    public function store(StoreLayoutTemplateRequest $request, CurrentCompany $currentCompany): RedirectResponse
    {
        $data = $request->validated();
        $companyId = $currentCompany->get()->id;
        $userId = $request->user()->id;
        $mode = (string) $data['mode'];

        if ($mode === 'import') {
            $this->importTemplate($request, $companyId, $userId);
        } else {
            $this->createTemplate($data, $companyId, $userId);
        }

        return back()->with('success', 'Plantilla de plano guardada.');
    }

    public function toggle(LayoutTemplate $layoutTemplate): RedirectResponse
    {
        $layoutTemplate->update(['status' => $layoutTemplate->status === 'active' ? 'inactive' : 'active']);

        return back()->with('success', 'Estado del plano actualizado.');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createTemplate(array $data, string $companyId, string $userId): LayoutTemplate
    {
        $templateType = (string) $data['template_type'];

        $source = match ($templateType) {
            'sectors' => $this->buildSectorSource($data),
            'matrix' => $this->buildMatrixSource($data),
            'mixed' => $this->buildMixedSource($data),
            default => throw ValidationException::withMessages(['template_type' => 'El tipo de plantilla no es válido.']),
        };

        $encoded = json_encode($source, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $path = 'layouts/generated/'.Str::uuid().'.json';
        Storage::disk('local')->put($path, $encoded);

        $media = MediaAsset::query()->create([
            'company_id' => $companyId,
            'disk' => 'local',
            'path' => $path,
            'original_name' => 'plantilla-'.$templateType.'.json',
            'mime_type' => 'application/json',
            'size_bytes' => strlen($encoded),
            'checksum_sha256' => hash('sha256', $encoded),
            'uploaded_by_user_id' => $userId,
        ]);

        return DB::transaction(function () use ($companyId, $userId, $data, $encoded, $media, $source, $templateType): LayoutTemplate {
            return $this->persistTemplate(
                companyId: $companyId,
                userId: $userId,
                name: (string) $data['name'],
                templateType: $templateType,
                schemaVersion: (string) ($source['schema_version'] ?? '2.0'),
                encodedSource: $encoded,
                source: $source,
                media: $media,
            );
        }, 3);
    }

    private function importTemplate(StoreLayoutTemplateRequest $request, string $companyId, string $userId): LayoutTemplate
    {
        $file = $request->file('layout_file');

        if ($file === null) {
            throw ValidationException::withMessages(['layout_file' => 'Selecciona un archivo JSON válido.']);
        }

        try {
            $source = json_decode($file->getContent(), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw ValidationException::withMessages(['layout_file' => 'El archivo no contiene JSON válido.']);
        }

        if (! is_array($source)) {
            throw ValidationException::withMessages(['layout_file' => 'El archivo no contiene una estructura válida.']);
        }

        if (! isset($source['nodes']) || ! is_array($source['nodes']) || $source['nodes'] === []) {
            throw ValidationException::withMessages(['layout_file' => 'El archivo debe contener un arreglo nodes con al menos una ubicación.']);
        }

        $normalizedSource = $this->normalizeImportedSource($source);
        $encoded = json_encode($normalizedSource, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $path = $file->store('layouts');

        $media = MediaAsset::query()->create([
            'company_id' => $companyId,
            'disk' => 'local',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/json',
            'size_bytes' => $file->getSize(),
            'checksum_sha256' => hash('sha256', $file->getContent()),
            'uploaded_by_user_id' => $userId,
        ]);

        return DB::transaction(function () use ($companyId, $userId, $normalizedSource, $encoded, $media, $request): LayoutTemplate {
            return $this->persistTemplate(
                companyId: $companyId,
                userId: $userId,
                name: $request->string('name')->toString(),
                templateType: (string) $normalizedSource['template_type'],
                schemaVersion: (string) ($normalizedSource['schema_version'] ?? '2.0'),
                encodedSource: $encoded,
                source: $normalizedSource,
                media: $media,
            );
        }, 3);
    }

    /**
     * @param  array<string, mixed>  $source
     * @return array{schema_version: string, template_type: string, nodes: array<int, array<string, mixed>>, sectors?: array<int, array<string, mixed>>, matrix?: array<string, mixed>}
     */
    private function normalizeImportedSource(array $source): array
    {
        if (isset($source['template_type']) && is_string($source['template_type'])) {
            $templateType = $source['template_type'];
        } else {
            $templateType = $this->inferTemplateTypeFromNodes($source['nodes'] ?? []);
        }

        if (isset($source['nodes']) && is_array($source['nodes'])) {
            return [
                'schema_version' => (string) ($source['schema_version'] ?? '1.0'),
                'template_type' => $templateType,
                'nodes' => $source['nodes'],
                ...(isset($source['sectors']) && is_array($source['sectors']) ? ['sectors' => $source['sectors']] : []),
                ...(isset($source['matrix']) && is_array($source['matrix']) ? ['matrix' => $source['matrix']] : []),
            ];
        }

        return [
            'schema_version' => (string) ($source['schema_version'] ?? '1.0'),
            'template_type' => $templateType,
            'nodes' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{schema_version: string, template_type: string, nodes: array<int, array<string, mixed>>, sectors: array<int, array<string, mixed>>}
     */
    private function buildSectorSource(array $data): array
    {
        $sectors = [];
        $nodes = [];

        foreach (($data['sectors'] ?? []) as $index => $sector) {
            if (! is_array($sector)) {
                continue;
            }

            $key = trim((string) ($sector['key'] ?? ''));
            $label = trim((string) ($sector['label'] ?? ''));
            $price = $this->formatMoney($sector['price'] ?? '0');
            $capacity = max(1, (int) ($sector['capacity'] ?? 1));
            $color = $this->sectorColor($index, $sector['color'] ?? null);
            $geometry = [
                'x' => 30 + ($index * 220),
                'y' => 40,
                'width' => 180,
                'height' => 130,
            ];

            $sectors[] = [
                'key' => $key,
                'label' => $label,
                'price' => $price,
                'capacity' => $capacity,
                'color' => $color,
                'geometry' => $geometry,
            ];

            $nodes[] = [
                'key' => $key,
                'label' => $label,
                'type' => 'sector',
                'capacity' => $capacity,
                'selectable' => true,
                'sale_mode' => 'group',
                'geometry' => $geometry,
                'style' => ['fill' => $color],
                'metadata' => ['price' => $price, 'template_type' => 'sectors'],
            ];
        }

        if ($nodes === []) {
            throw ValidationException::withMessages(['sectors' => 'Agrega al menos un sector.']);
        }

        return [
            'schema_version' => '2.0',
            'template_type' => 'sectors',
            'sectors' => $sectors,
            'nodes' => $nodes,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{schema_version: string, template_type: string, matrix: array<string, mixed>, nodes: array<int, array<string, mixed>>}
     */
    private function buildMatrixSource(array $data): array
    {
        $matrix = $data['matrix'] ?? [];
        if (! is_array($matrix)) {
            throw ValidationException::withMessages(['matrix' => 'La matriz no tiene una estructura válida.']);
        }

        $rows = max(1, (int) ($matrix['rows'] ?? 1));
        $columns = max(1, (int) ($matrix['columns'] ?? 1));
        $price = $this->formatMoney($matrix['price'] ?? '0');
        $disabledCells = $this->normalizeDisabledCells(is_array($matrix['disabled_cells'] ?? null) ? $matrix['disabled_cells'] : []);
        $disabledLookup = array_fill_keys($disabledCells, true);
        $enabledCapacity = max(0, ($rows * $columns) - count($disabledCells));

        $nodes = [];
        $rootKey = 'matrix';
        $nodes[] = [
            'key' => $rootKey,
            'label' => 'Matriz',
            'type' => 'matrix',
            'capacity' => $enabledCapacity,
            'selectable' => false,
            'sale_mode' => 'group',
            'geometry' => [
                'x' => 20,
                'y' => 20,
                'width' => max(1, $columns) * 72,
                'height' => max(1, $rows) * 72,
            ],
            'style' => ['fill' => '#0f172a'],
            'metadata' => ['price' => $price, 'rows' => $rows, 'columns' => $columns, 'disabled_cells' => $disabledCells],
        ];

        for ($row = 1; $row <= $rows; $row++) {
            $rowKey = 'row-'.$row;
            $rowGeometry = [
                'x' => 24,
                'y' => 28 + (($row - 1) * 72),
                'width' => max(1, $columns) * 64,
                'height' => 56,
            ];

            $nodes[] = [
                'key' => $rowKey,
                'label' => 'Fila '.$row,
                'type' => 'row',
                'parent' => $rootKey,
                'capacity' => $columns,
                'selectable' => false,
                'sale_mode' => 'group',
                'geometry' => $rowGeometry,
                'style' => ['fill' => '#1e293b'],
                'metadata' => ['row' => $row],
            ];

            for ($column = 1; $column <= $columns; $column++) {
                $cellKey = $row.'-'.$column;
                $disabled = isset($disabledLookup[$cellKey]);

                $nodes[] = [
                    'key' => 'cell-'.$cellKey,
                    'label' => 'Asiento '.$row.'-'.$column,
                    'type' => 'cell',
                    'parent' => $rowKey,
                    'capacity' => 1,
                    'selectable' => ! $disabled,
                    'sale_mode' => 'individual',
                    'geometry' => [
                        'x' => 32 + (($column - 1) * 64),
                        'y' => 36 + (($row - 1) * 72),
                        'width' => 52,
                        'height' => 44,
                    ],
                    'style' => ['fill' => $disabled ? '#475569' : '#06b6d4'],
                    'metadata' => [
                        'row' => $row,
                        'column' => $column,
                        'price' => $price,
                        'disabled' => $disabled,
                    ],
                ];
            }
        }

        return [
            'schema_version' => '2.0',
            'template_type' => 'matrix',
            'matrix' => [
                'rows' => $rows,
                'columns' => $columns,
                'price' => $price,
                'disabled_cells' => $disabledCells,
            ],
            'nodes' => $nodes,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{schema_version: string, template_type: string, sectors: array<int, array<string, mixed>>, nodes: array<int, array<string, mixed>>}
     */
    private function buildMixedSource(array $data): array
    {
        $mixed = $data['mixed'] ?? [];
        if (! is_array($mixed)) {
            throw ValidationException::withMessages(['mixed' => 'La configuración mixta no tiene una estructura válida.']);
        }

        $sectors = [];
        $nodes = [];

        foreach ((array) ($mixed['sectors'] ?? []) as $sectorIndex => $sector) {
            if (! is_array($sector)) {
                continue;
            }

            $sectorKey = trim((string) ($sector['key'] ?? ''));
            $sectorLabel = trim((string) ($sector['label'] ?? ''));
            $sectorPrice = $this->formatMoney($sector['price'] ?? '0');
            $tables = [];
            $sectorCapacity = 0;
            $sectorGeometry = [
                'x' => 20 + ($sectorIndex * 320),
                'y' => 30,
                'width' => 280,
                'height' => 260,
            ];

            $sectorNodeKey = 'sector-'.$sectorKey;
            $nodes[] = [
                'key' => $sectorNodeKey,
                'label' => $sectorLabel,
                'type' => 'sector',
                'capacity' => 0,
                'selectable' => false,
                'sale_mode' => 'group',
                'geometry' => $sectorGeometry,
                'style' => ['fill' => $this->sectorColor($sectorIndex, $sector['color'] ?? null)],
                'metadata' => ['price' => $sectorPrice, 'template_type' => 'mixed'],
            ];

            foreach ((array) ($sector['tables'] ?? []) as $tableIndex => $table) {
                if (! is_array($table)) {
                    continue;
                }

                $tableKey = trim((string) ($table['key'] ?? ''));
                $tableLabel = trim((string) ($table['label'] ?? ''));
                $chairs = max(1, (int) ($table['chairs'] ?? 1));
                $tableCapacity = $chairs;
                $sectorCapacity += $chairs;
                $tableGeometry = [
                    'x' => $sectorGeometry['x'] + 18 + (($tableIndex % 2) * 118),
                    'y' => $sectorGeometry['y'] + 48 + (int) floor($tableIndex / 2) * 92,
                    'width' => 94,
                    'height' => 64,
                ];

                $tableNodeKey = 'table-'.$sectorKey.'-'.$tableKey;
                $nodes[] = [
                    'key' => $tableNodeKey,
                    'label' => $tableLabel,
                    'type' => 'table',
                    'parent' => $sectorNodeKey,
                    'capacity' => $tableCapacity,
                    'selectable' => false,
                    'sale_mode' => 'group',
                    'geometry' => $tableGeometry,
                    'style' => ['fill' => '#f59e0b'],
                    'metadata' => ['price' => $sectorPrice, 'chairs' => $chairs, 'template_type' => 'mixed'],
                ];

                for ($chairIndex = 1; $chairIndex <= $chairs; $chairIndex++) {
                    $chairKey = 'seat-'.$sectorKey.'-'.$tableKey.'-'.$chairIndex;
                    $nodes[] = [
                        'key' => $chairKey,
                        'label' => 'Silla '.$chairIndex,
                        'type' => 'seat',
                        'parent' => $tableNodeKey,
                        'capacity' => 1,
                        'selectable' => true,
                        'sale_mode' => 'individual',
                        'geometry' => [
                            'x' => $tableGeometry['x'] + 8 + (($chairIndex - 1) * 15),
                            'y' => $tableGeometry['y'] + 30,
                            'width' => 12,
                            'height' => 12,
                        ],
                        'style' => ['fill' => '#a855f7'],
                        'metadata' => ['price' => $sectorPrice, 'template_type' => 'mixed'],
                    ];
                }
            }

            $sectors[] = [
                'key' => $sectorKey,
                'label' => $sectorLabel,
                'price' => $sectorPrice,
                'capacity' => $sectorCapacity,
                'tables' => $sector['tables'] ?? [],
                'geometry' => $sectorGeometry,
            ];
        }

        if ($nodes === []) {
            throw ValidationException::withMessages(['sectors' => 'Agrega al menos un sector.']);
        }

        return [
            'schema_version' => '2.0',
            'template_type' => 'mixed',
            'sectors' => $sectors,
            'nodes' => $nodes,
        ];
    }

    /**
     * @param  array<string, mixed>  $source
     * @param  array<int, array<string, mixed>>  $nodes
     */
    private function persistTemplate(
        string $companyId,
        string $userId,
        string $name,
        string $templateType,
        string $schemaVersion,
        string $encodedSource,
        array $source,
        MediaAsset $media,
    ): LayoutTemplate {
        $nodeIds = [];
        $template = LayoutTemplate::query()->create([
            'company_id' => $companyId,
            'name' => $name,
            'template_type' => $templateType,
            'version' => (int) LayoutTemplate::query()
                ->where('company_id', $companyId)
                ->where('name', $name)
                ->max('version') + 1,
            'schema_version' => $schemaVersion,
            'source_media_id' => $media->id,
            'source_json' => $source,
            'checksum_sha256' => hash('sha256', $encodedSource),
            'validation_status' => 'valid',
            'created_by_user_id' => $userId,
        ]);

        foreach ($source['nodes'] as $index => $node) {
            if (! is_array($node) || ! isset($node['key'], $node['type'])) {
                throw ValidationException::withMessages(['layout_file' => 'Cada nodo requiere key y type.']);
            }

            $createdNode = LayoutTemplateNode::query()->create([
                'layout_template_id' => $template->id,
                'parent_id' => isset($node['parent']) ? ($nodeIds[$node['parent']] ?? null) : null,
                'external_key' => (string) $node['key'],
                'node_type' => (string) $node['type'],
                'label' => isset($node['label']) ? (string) $node['label'] : null,
                'capacity' => max(1, (int) ($node['capacity'] ?? 1)),
                'is_selectable' => (bool) ($node['selectable'] ?? true),
                'sale_mode' => (string) ($node['sale_mode'] ?? 'individual'),
                'geometry_json' => is_array($node['geometry'] ?? null) ? $node['geometry'] : [],
                'style_json' => is_array($node['style'] ?? null) ? $node['style'] : [],
                'metadata_json' => is_array($node['metadata'] ?? null) ? $node['metadata'] : [],
                'sort_order' => $index,
            ]);
            $nodeIds[(string) $node['key']] = $createdNode->id;
        }

        return $template;
    }

    /**
     * @param  array<int, array<string, mixed>>  $nodes
     */
    private function inferTemplateTypeFromNodes(array $nodes): string
    {
        $types = array_values(array_filter(array_map(
            static fn (mixed $node): ?string => is_array($node) && isset($node['type']) ? (string) $node['type'] : null,
            $nodes,
        )));

        if (array_intersect(['row', 'cell', 'matrix_cell'], $types) !== []) {
            return 'matrix';
        }

        if (array_intersect(['table', 'seat'], $types) !== []) {
            return 'mixed';
        }

        return 'sectors';
    }

    /**
     * @param  array<int, string|array<string, int>|array{row:int,column:int}>  $disabledCells
     * @return array<int, string>
     */
    private function normalizeDisabledCells(array $disabledCells): array
    {
        $normalized = [];

        foreach ($disabledCells as $disabledCell) {
            if (is_string($disabledCell) && preg_match('/^\d+-\d+$/', $disabledCell) === 1) {
                $normalized[] = $disabledCell;

                continue;
            }

            if (is_array($disabledCell) && isset($disabledCell['row'], $disabledCell['column'])) {
                $normalized[] = ((int) $disabledCell['row']).'-'.((int) $disabledCell['column']);
            }
        }

        return array_values(array_unique($normalized));
    }

    private function formatMoney(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    private function sectorColor(int $index, mixed $color): string
    {
        if (is_string($color) && trim($color) !== '') {
            return trim($color);
        }

        return ['#06b6d4', '#f59e0b', '#a855f7', '#22c55e', '#ef4444'][$index % 5];
    }
}
