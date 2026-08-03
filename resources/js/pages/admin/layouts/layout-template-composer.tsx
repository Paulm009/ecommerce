import { useForm } from '@inertiajs/react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { FieldError } from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import layoutsRoutes from '@/routes/admin/layouts';
import {
    buildPreviewNodes,
    createLayoutTemplateForm,
    createMixedSectorDraft,
    createMixedTableDraft,
    createSectorDraft,
} from './template-builder';
import type {
    LayoutTemplateForm,
    PreviewGeometry,
    PreviewNode,
    TemplateType,
} from './template-builder';

type PreviewBounds = {
    minX: number;
    minY: number;
    width: number;
    height: number;
};

type ResolvedGeometry = {
    x: number;
    y: number;
    width: number;
    height: number;
};

function sortPreviewNodes(nodes: PreviewNode[]): PreviewNode[] {
    return [...nodes].sort((left, right) => left.sort_order - right.sort_order);
}

function getPreviewGeometryBounds(geometries: ResolvedGeometry[]): PreviewBounds {
    if (geometries.length === 0) {
        return { minX: 0, minY: 0, width: 1, height: 1 };
    }

    const minX = Math.min(...geometries.map((geometry) => geometry.x));
    const minY = Math.min(...geometries.map((geometry) => geometry.y));
    const maxX = Math.max(...geometries.map((geometry) => geometry.x + geometry.width));
    const maxY = Math.max(...geometries.map((geometry) => geometry.y + geometry.height));

    return {
        minX,
        minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1),
    };
}

function getPreviewGeometry(
    node: PreviewNode,
    nodesById: Map<string, PreviewNode>,
    nodesByParentId: Map<string, PreviewNode[]>,
    templateType?: TemplateType,
): ResolvedGeometry {
    const geometry: PreviewGeometry = node.geometry_json ?? { x: 0, y: 0, width: 1, height: 1 };

    if (templateType !== 'mixed') {
        return {
            x: Number(geometry.x) || 0,
            y: Number(geometry.y) || 0,
            width: Math.max(Number(geometry.width) || 1, 1),
            height: Math.max(Number(geometry.height) || 1, 1),
        };
    }

    if (node.node_type === 'table') {
        const size = Math.max(Math.min(Number(geometry.width) || 1, Number(geometry.height) || 1) * 0.6, 36);

        return {
            x: (Number(geometry.x) || 0) + (((Number(geometry.width) || 1) - size) / 2),
            y: (Number(geometry.y) || 0) + (((Number(geometry.height) || 1) - size) / 2),
            width: size,
            height: size,
        };
    }

    if (node.node_type !== 'seat' || node.parent_id === null) {
        return {
            x: Number(geometry.x) || 0,
            y: Number(geometry.y) || 0,
            width: Math.max(Number(geometry.width) || 1, 1),
            height: Math.max(Number(geometry.height) || 1, 1),
        };
    }

    const parent = nodesById.get(node.parent_id);

    if (parent === undefined) {
        return {
            x: Number(geometry.x) || 0,
            y: Number(geometry.y) || 0,
            width: Math.max(Number(geometry.width) || 1, 1),
            height: Math.max(Number(geometry.height) || 1, 1),
        };
    }

    const siblingSeats = (nodesByParentId.get(node.parent_id) ?? [])
        .filter((sibling) => sibling.node_type === 'seat')
        .sort((left, right) => left.sort_order - right.sort_order);
    const seatIndex = siblingSeats.findIndex((sibling) => sibling.id === node.id);
    const normalizedIndex = seatIndex >= 0 ? seatIndex : 0;
    const seatCount = Math.max(siblingSeats.length, 1);
    const parentGeometry = parent.geometry_json ?? { x: 0, y: 0, width: 1, height: 1 };
    const parentX = Number(parentGeometry.x) || 0;
    const parentY = Number(parentGeometry.y) || 0;
    const parentWidth = Math.max(Number(parentGeometry.width) || 1, 1);
    const parentHeight = Math.max(Number(parentGeometry.height) || 1, 1);
    const centerX = parentX + (parentWidth / 2);
    const centerY = parentY + (parentHeight / 2);
    const seatWidth = 9;
    const seatHeight = 9;
    const renderedTableDiameter = Math.max(Math.min(parentWidth, parentHeight) * 0.6, 36);
    const tableRadius = renderedTableDiameter / 2;
    const seatRadius = Math.max(Math.min(seatWidth, seatHeight) / 2, 4);
    const orbitRadius = tableRadius + seatRadius + Math.max(renderedTableDiameter * 0.08, 4);
    const angle = ((Math.PI * 2) * normalizedIndex) / seatCount - (Math.PI / 2);

    return {
        x: centerX + (Math.cos(angle) * orbitRadius) - (seatWidth / 2),
        y: centerY + (Math.sin(angle) * orbitRadius) - (seatHeight / 2),
        width: seatWidth,
        height: seatHeight,
    };
}

function DraftPreviewCanvas({
    nodes,
    templateType,
}: {
    nodes: PreviewNode[];
    templateType?: TemplateType;
}): ReactElement {
    const sortedNodes = sortPreviewNodes(nodes);
    const nodesById = new Map(sortedNodes.map((node) => [node.id, node]));
    const nodesByParentId = sortedNodes.reduce<Map<string, PreviewNode[]>>((map, node) => {
        if (node.parent_id === null) {
            return map;
        }

        const siblings = map.get(node.parent_id) ?? [];
        siblings.push(node);
        map.set(node.parent_id, siblings);

        return map;
    }, new Map<string, PreviewNode[]>());
    const renderNodes =
        templateType === 'matrix'
            ? sortedNodes.filter((node) => node.node_type === 'cell')
            : sortedNodes;
    const bounds = renderNodes.length === 0
        ? { minX: 0, minY: 0, width: 1, height: 1 }
        : getPreviewGeometryBounds(
              renderNodes.map((node) =>
                  getPreviewGeometry(node, nodesById, nodesByParentId, templateType),
              ),
          );

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-50">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_45%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)] bg-[size:22px_22px] opacity-30" />
            <div className="absolute inset-3">
                {renderNodes.length === 0 ? (
                    <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 bg-white/5 text-sm text-slate-300">
                        Sin vista previa todavía.
                    </div>
                ) : (
                    renderNodes.map((node) => {
                        const geometry = getPreviewGeometry(node, nodesById, nodesByParentId, templateType);
                        const widthPercent = (geometry.width / bounds.width) * 100;
                        const heightPercent = (geometry.height / bounds.height) * 100;
                        const mixedCircular =
                            templateType === 'mixed' &&
                            (node.node_type === 'seat' || node.node_type === 'table');
                        const minimumSize = mixedCircular ? 1.25 : 5;
                        const width = mixedCircular
                            ? Math.max(Math.min(widthPercent, heightPercent), minimumSize)
                            : Math.max(widthPercent, minimumSize);
                        const height = mixedCircular
                            ? Math.max(Math.min(widthPercent, heightPercent), minimumSize)
                            : Math.max(heightPercent, minimumSize);
                        const left = ((geometry.x - bounds.minX) / bounds.width) * 100;
                        const top = ((geometry.y - bounds.minY) / bounds.height) * 100;
                        const safeLeft = Math.min(Math.max(left, 0), Math.max(100 - width, 0));
                        const safeTop = Math.min(Math.max(top, 0), Math.max(100 - height, 0));
                        const fill =
                            templateType === 'matrix'
                                ? node.is_selectable
                                    ? '#22c55e'
                                    : '#ef4444'
                                : templateType === 'mixed' && node.node_type === 'seat'
                                    ? '#a855f7'
                                    : templateType === 'mixed' && node.node_type === 'table'
                                        ? '#f59e0b'
                                        : templateType === 'mixed' && node.node_type === 'sector'
                                            ? '#38bdf8'
                                            : typeof node.style_json?.fill === 'string'
                                                ? node.style_json.fill
                                                : '#64748b';

                        return (
                            <article
                                key={node.id}
                                className={
                                    templateType === 'mixed' && (node.node_type === 'seat' || node.node_type === 'table')
                                        ? 'absolute overflow-hidden rounded-full border border-white/20 shadow-[0_18px_40px_rgba(2,6,23,.24)]'
                                        : 'absolute overflow-hidden rounded-xl border border-white/20 shadow-[0_18px_40px_rgba(2,6,23,.24)]'
                                }
                                style={{
                                    left: `${safeLeft}%`,
                                    top: `${safeTop}%`,
                                    width: `${width}%`,
                                    height: `${height}%`,
                                    backgroundColor: fill,
                                    opacity: node.is_selectable ? 1 : 0.74,
                                }}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

function TemplateTypePill({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: string;
    onClick: () => void;
}): ReactElement {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition',
                active
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
            ].join(' ')}
        >
            {children}
        </button>
    );
}

export default function LayoutTemplateComposer({
    onSaved,
}: {
    onSaved?: () => void;
}): ReactElement {
    const [mode, setMode] = useState<'create' | 'import'>('create');
    const createForm = useForm<LayoutTemplateForm>(createLayoutTemplateForm());
    const importForm = useForm<{ mode: 'import'; name: string; layout_file: File | null }>({
        mode: 'import',
        name: '',
        layout_file: null,
    });

    const submitCreate = (event: FormEvent): void => {
        event.preventDefault();

        createForm.post(layoutsRoutes.store().url, {
            forceFormData: true,
            onSuccess: () => {
                createForm.reset();
                onSaved?.();
            },
        });
    };

    const submitImport = (event: FormEvent): void => {
        event.preventDefault();

        importForm.post(layoutsRoutes.store().url, {
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                onSaved?.();
            },
        });
    };

    const updateSector = (index: number, updates: Partial<(typeof createForm.data.sectors)[number]>): void => {
        createForm.setData(
            'sectors',
            createForm.data.sectors.map((sector, currentIndex) => (
                currentIndex === index ? { ...sector, ...updates } : sector
            )),
        );
    };

    const updateMatrix = (updates: Partial<LayoutTemplateForm['matrix']>): void => {
        createForm.setData('matrix', { ...createForm.data.matrix, ...updates });
    };

    const updateMixedSector = (
        index: number,
        updates: Partial<(typeof createForm.data.mixed.sectors)[number]>,
    ): void => {
        createForm.setData(
            'mixed',
            {
                sectors: createForm.data.mixed.sectors.map((sector, currentIndex) => (
                    currentIndex === index ? { ...sector, ...updates } : sector
                )),
            },
        );
    };

    const updateMixedTable = (
        sectorIndex: number,
        tableIndex: number,
        updates: Partial<(typeof createForm.data.mixed.sectors)[number]['tables'][number]>,
    ): void => {
        createForm.setData(
            'mixed',
            {
                sectors: createForm.data.mixed.sectors.map((sector, currentSectorIndex) => (
                    currentSectorIndex === sectorIndex
                        ? {
                              ...sector,
                              tables: sector.tables.map((table, currentTableIndex) => (
                                  currentTableIndex === tableIndex ? { ...table, ...updates } : table
                              )),
                          }
                        : sector
                )),
            },
        );
    };

    const draftNodes = buildPreviewNodes(createForm.data);

    return (
        <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <TemplateTypePill active={mode === 'create'} onClick={() => setMode('create')}>
                        Crear
                    </TemplateTypePill>
                    <TemplateTypePill active={mode === 'import'} onClick={() => setMode('import')}>
                        Importar
                    </TemplateTypePill>
                </div>

                {mode === 'create' ? (
                    <form onSubmit={submitCreate} className="space-y-5">
                        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                            <div>
                                <Label>Nombre</Label>
                                <Input
                                    value={createForm.data.name}
                                    onChange={(event) => createForm.setData('name', event.target.value)}
                                />
                                <FieldError message={createForm.errors.name} />
                            </div>
                            <div>
                                <Label>Tipo</Label>
                                <select
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    value={createForm.data.template_type}
                                    onChange={(event) => createForm.setData('template_type', event.target.value as TemplateType)}
                                >
                                    <option value="sectors">Por sectores</option>
                                    <option value="matrix">Matriz</option>
                                    <option value="mixed">Mixto</option>
                                </select>
                                <FieldError message={createForm.errors.template_type} />
                            </div>
                        </div>

                        {createForm.data.template_type === 'sectors' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sectores</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => createForm.setData('sectors', [...createForm.data.sectors, createSectorDraft(createForm.data.sectors.length)])}
                                    >
                                        <Plus className="size-4" />
                                        Agregar sector
                                    </Button>
                                </div>

                                {createForm.data.sectors.map((sector, index) => (
                                    <div key={sector.key} className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <Label>Clave</Label>
                                                <Input value={sector.key} onChange={(event) => updateSector(index, { key: event.target.value })} />
                                            </div>
                                            <div>
                                                <Label>Nombre</Label>
                                                <Input value={sector.label} onChange={(event) => updateSector(index, { label: event.target.value })} />
                                            </div>
                                        </div>
                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                            <div>
                                                <Label>Precio</Label>
                                                <Input type="number" step="0.01" value={sector.price} onChange={(event) => updateSector(index, { price: event.target.value })} />
                                            </div>
                                            <div>
                                                <Label>Cantidad</Label>
                                                <Input type="number" min="1" value={sector.capacity} onChange={(event) => updateSector(index, { capacity: event.target.value })} />
                                            </div>
                                            <div>
                                                <Label>Color</Label>
                                                <Input value={sector.color} onChange={(event) => updateSector(index, { color: event.target.value })} />
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    createForm.setData(
                                                        'sectors',
                                                        createForm.data.sectors.filter((_, currentIndex) => currentIndex !== index),
                                                    );
                                                }}
                                            >
                                                <Trash2 className="size-4" />
                                                Quitar
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <FieldError message={createForm.errors.sectors} />
                            </div>
                        )}

                        {createForm.data.template_type === 'matrix' && (
                            <div className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div>
                                        <Label>Filas</Label>
                                        <Input type="number" min="1" value={createForm.data.matrix.rows} onChange={(event) => updateMatrix({ rows: event.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Columnas</Label>
                                        <Input type="number" min="1" value={createForm.data.matrix.columns} onChange={(event) => updateMatrix({ columns: event.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Precio general</Label>
                                        <Input type="number" step="0.01" value={createForm.data.matrix.price} onChange={(event) => updateMatrix({ price: event.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Celdas no disponibles</h4>
                                        <span className="text-xs text-muted-foreground">Haz clic para alternar disponibilidad</span>
                                    </div>
                                    <div
                                        className="grid gap-2 overflow-auto rounded-2xl border bg-muted/20 p-3"
                                        style={{
                                            gridTemplateColumns: `repeat(${Math.max(Number(createForm.data.matrix.columns) || 1, 1)}, minmax(0, 1fr))`,
                                        }}
                                    >
                                        {Array.from({ length: Math.max(Number(createForm.data.matrix.rows) || 1, 1) }, (_, rowIndex) =>
                                            Array.from({ length: Math.max(Number(createForm.data.matrix.columns) || 1, 1) }, (_, columnIndex) => {
                                                const cellKey = `${rowIndex + 1}-${columnIndex + 1}`;
                                                const disabled = createForm.data.matrix.disabled_cells.includes(cellKey);

                                                return (
                                                    <button
                                                        key={cellKey}
                                                        type="button"
                                                        aria-label={`${cellKey} ${disabled ? 'no disponible' : 'disponible'}`}
                                                        onClick={() => {
                                                            const disabledCells = disabled
                                                                ? createForm.data.matrix.disabled_cells.filter((item) => item !== cellKey)
                                                                : [...createForm.data.matrix.disabled_cells, cellKey];

                                                            updateMatrix({ disabled_cells: disabledCells });
                                                        }}
                                                        className={[
                                                            'aspect-square rounded-lg border transition',
                                                            disabled
                                                                ? 'border-rose-500/60 bg-rose-500'
                                                                : 'border-emerald-500/60 bg-emerald-500',
                                                        ].join(' ')}
                                                    >
                                                    </button>
                                                );
                                            }),
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {createForm.data.template_type === 'mixed' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sectores y mesas</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => createForm.setData('mixed', {
                                            sectors: [...createForm.data.mixed.sectors, createMixedSectorDraft(createForm.data.mixed.sectors.length)],
                                        })}
                                    >
                                        <Plus className="size-4" />
                                        Agregar sector
                                    </Button>
                                </div>

                                {createForm.data.mixed.sectors.map((sector, sectorIndex) => (
                                    <div key={sector.key} className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <Label>Clave</Label>
                                                <Input value={sector.key} onChange={(event) => updateMixedSector(sectorIndex, { key: event.target.value })} />
                                            </div>
                                            <div>
                                                <Label>Nombre</Label>
                                                <Input value={sector.label} onChange={(event) => updateMixedSector(sectorIndex, { label: event.target.value })} />
                                            </div>
                                        </div>
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <div>
                                                <Label>Precio</Label>
                                                <Input type="number" step="0.01" value={sector.price} onChange={(event) => updateMixedSector(sectorIndex, { price: event.target.value })} />
                                            </div>
                                            <div>
                                                <Label>Color</Label>
                                                <Input value={sector.color} onChange={(event) => updateMixedSector(sectorIndex, { color: event.target.value })} />
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mesas</h5>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        updateMixedSector(sectorIndex, {
                                                            tables: [...sector.tables, createMixedTableDraft(sector.tables.length)],
                                                        });
                                                    }}
                                                >
                                                    <Plus className="size-4" />
                                                    Agregar mesa
                                                </Button>
                                            </div>

                                            {sector.tables.map((table, tableIndex) => (
                                                <div key={table.key} className="rounded-xl border bg-background p-3">
                                                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
                                                        <div>
                                                            <Label>Clave</Label>
                                                            <Input value={table.key} onChange={(event) => updateMixedTable(sectorIndex, tableIndex, { key: event.target.value })} />
                                                        </div>
                                                        <div>
                                                            <Label>Nombre</Label>
                                                            <Input value={table.label} onChange={(event) => updateMixedTable(sectorIndex, tableIndex, { label: event.target.value })} />
                                                        </div>
                                                        <div>
                                                            <Label>Sillas</Label>
                                                            <Input type="number" min="1" value={table.chairs} onChange={(event) => updateMixedTable(sectorIndex, tableIndex, { chairs: event.target.value })} />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    updateMixedSector(sectorIndex, {
                                                                        tables: sector.tables.filter((_, currentIndex) => currentIndex !== tableIndex),
                                                                    });
                                                                }}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Vista previa</h4>
                                <span className="text-xs text-muted-foreground">{draftNodes.length} nodos generados</span>
                            </div>
                            <DraftPreviewCanvas
                                nodes={draftNodes}
                                templateType={createForm.data.template_type}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="submit" disabled={createForm.processing}>
                                Guardar plantilla
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitImport} className="space-y-4">
                        <div>
                            <Label>Nombre</Label>
                            <Input
                                value={importForm.data.name}
                                onChange={(event) => importForm.setData('name', event.target.value)}
                            />
                            <FieldError message={importForm.errors.name} />
                        </div>

                        <label className="grid min-h-40 cursor-pointer place-items-center rounded-xl border border-dashed text-center transition hover:border-primary/40 hover:bg-primary/5">
                            <span>
                                <strong className="mx-auto block">
                                    {importForm.data.layout_file?.name ?? 'Seleccionar JSON'}
                                </strong>
                                <small className="mt-1 block text-muted-foreground">
                                    JSON legado o estructurado con template_type y nodes
                                </small>
                            </span>
                            <input
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={(event) => importForm.setData('layout_file', event.target.files?.[0] ?? null)}
                            />
                        </label>
                        <FieldError message={importForm.errors.layout_file} />

                        <div className="flex justify-end">
                            <Button type="submit" disabled={importForm.processing}>
                                <Upload className="size-4" />
                                Importar plantilla
                            </Button>
                        </div>
                    </form>
                )}
        </div>
    );
}
