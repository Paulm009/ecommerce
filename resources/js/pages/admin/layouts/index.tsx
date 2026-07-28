import { Head, router } from '@inertiajs/react';
import { Map as MapIcon, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    PageHeader,
    Pagination,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { dateTime } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import layoutsRoutes from '@/routes/admin/layouts';
import LayoutTemplateComposer from './layout-template-composer';

type LayoutGeometry = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
};

type LayoutNode = {
    id: string;
    parent_id: string | null;
    external_key: string;
    node_type: string;
    label: string | null;
    capacity: number;
    is_selectable: boolean;
    geometry_json: Record<string, unknown> | null;
    style_json: Record<string, unknown> | null;
    metadata_json: Record<string, unknown> | null;
    sort_order: number;
};

type LayoutTreeNode = LayoutNode & {
    children: LayoutTreeNode[];
};

type Layout = {
    id: string;
    name: string;
    template_type: string | null;
    version: number;
    schema_version: string;
    status: string;
    validation_status: string;
    nodes_count: number;
    created_at: string;
    nodes: LayoutNode[];
};

type LayoutBounds = {
    minX: number;
    minY: number;
    width: number;
    height: number;
};

type LayoutSummary = {
    label: string;
    count: number;
};

type LayoutBadge = {
    label: string;
    value: string;
};

const DEFAULT_NODE_FILLS: Record<string, string> = {
    seat_group: '#06b6d4',
    table: '#f59e0b',
    box: '#a855f7',
    zone: '#22c55e',
    default: '#64748b',
};

const NODE_LABELS: Record<string, string> = {
    seat_group: 'Bloque',
    table: 'Mesa',
    box: 'Palco',
    zone: 'Zona',
};

function numberValue(value: unknown, fallback: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
}

function getGeometry(node: LayoutNode): Required<LayoutGeometry> {
    const geometry = node.geometry_json ?? {};

    return {
        x: numberValue(geometry.x, 0),
        y: numberValue(geometry.y, 0),
        width: Math.max(numberValue(geometry.width, 1), 1),
        height: Math.max(numberValue(geometry.height, 1), 1),
    };
}

function getBounds(nodes: LayoutNode[]): LayoutBounds {
    if (nodes.length === 0) {
        return { minX: 0, minY: 0, width: 1, height: 1 };
    }

    const geometries = nodes.map((node) => getGeometry(node));
    const minX = Math.min(...geometries.map((geometry) => geometry.x));
    const minY = Math.min(...geometries.map((geometry) => geometry.y));
    const maxX = Math.max(
        ...geometries.map((geometry) => geometry.x + geometry.width),
    );
    const maxY = Math.max(
        ...geometries.map((geometry) => geometry.y + geometry.height),
    );

    return {
        minX,
        minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1),
    };
}

function getBoundsFromGeometries(geometries: Required<LayoutGeometry>[]): LayoutBounds {
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

function sortLayoutNodes(nodes: LayoutNode[]): LayoutNode[] {
    return [...nodes].sort((left, right) => {
        if (left.sort_order === right.sort_order) {
            return left.external_key.localeCompare(right.external_key);
        }

        return left.sort_order - right.sort_order;
    });
}

function getRenderGeometry(
    node: LayoutNode,
    nodesById: Map<string, LayoutNode>,
    nodesByParentId: Map<string, LayoutNode[]>,
    templateType?: string | null,
): Required<LayoutGeometry> {
    const geometry = getGeometry(node);

    if (templateType !== 'mixed') {
        return geometry;
    }

    if (node.node_type === 'table') {
        const size = Math.max(Math.min(geometry.width, geometry.height) * 0.6, 36);

        return {
            x: geometry.x + ((geometry.width - size) / 2),
            y: geometry.y + ((geometry.height - size) / 2),
            width: size,
            height: size,
        };
    }

    if (node.node_type !== 'seat' || node.parent_id === null) {
        return geometry;
    }

    const parent = nodesById.get(node.parent_id);
    if (parent === undefined) {
        return geometry;
    }

    const siblingSeats = (nodesByParentId.get(node.parent_id) ?? [])
        .filter((sibling) => sibling.node_type === 'seat')
        .sort((left, right) => {
            if (left.sort_order === right.sort_order) {
                return left.external_key.localeCompare(right.external_key);
            }

            return left.sort_order - right.sort_order;
        });
    const seatIndex = siblingSeats.findIndex((sibling) => sibling.id === node.id);
    const normalizedIndex = seatIndex >= 0 ? seatIndex : 0;
    const seatCount = Math.max(siblingSeats.length, 1);
    const parentGeometry = getGeometry(parent);
    const centerX = parentGeometry.x + (parentGeometry.width / 2);
    const centerY = parentGeometry.y + (parentGeometry.height / 2);
    const seatWidth = 9;
    const seatHeight = 9;
    const renderedTableDiameter = Math.max(Math.min(parentGeometry.width, parentGeometry.height) * 0.6, 36);
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

function getStyleFill(style: Record<string, unknown> | null): string | null {
    const fill = style?.fill;

    if (Array.isArray(fill)) {
        const firstFill = fill.find((item) => typeof item === 'string' && item);

        return typeof firstFill === 'string' ? firstFill : null;
    }

    return typeof fill === 'string' && fill !== '' ? fill : null;
}

function getNodeFill(node: LayoutNode): string {
    return (
        getStyleFill(node.style_json) ??
        DEFAULT_NODE_FILLS[node.node_type] ??
        DEFAULT_NODE_FILLS.default
    );
}

function getReadableTextColor(fill: string): string {
    const normalized = fill.trim();

    if (!normalized.startsWith('#')) {
        return '#f8fafc';
    }

    const hex = normalized.slice(1);

    if (hex.length !== 3 && hex.length !== 6) {
        return '#f8fafc';
    }

    const expanded =
        hex.length === 3
            ? hex
                  .split('')
                  .map((character) => character + character)
                  .join('')
            : hex;
    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    const luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;

    return luminance > 0.58 ? '#0f172a' : '#f8fafc';
}

function formatNodeType(nodeType: string): string {
    return NODE_LABELS[nodeType] ?? nodeType.replaceAll('_', ' ');
}

function summarizeNodes(nodes: LayoutNode[]): LayoutSummary[] {
    const counts = nodes.reduce<Record<string, number>>((summary, node) => {
        summary[node.node_type] = (summary[node.node_type] ?? 0) + 1;

        return summary;
    }, {});

    return Object.entries(counts)
        .map(([label, count]) => ({ label: formatNodeType(label), count }))
        .sort((left, right) => right.count - left.count);
}

function getLayoutNodesByType(layout: Layout, nodeType: string): LayoutNode[] {
    return layout.nodes.filter((node) => node.node_type === nodeType);
}

function getLayoutCapacity(layout: Layout): number {
    switch (layout.template_type) {
        case 'matrix':
            return layout.nodes.filter(
                (node) => node.node_type === 'cell' && node.is_selectable,
            ).length;
        case 'mixed':
            return layout.nodes.filter(
                (node) => node.node_type === 'seat' && node.is_selectable,
            ).length;
        case 'sectors':
            return getLayoutNodesByType(layout, 'sector').reduce(
                (sum, node) => sum + node.capacity,
                0,
            );
        default:
            return layout.nodes
                .filter((node) => node.is_selectable)
                .reduce((sum, node) => sum + node.capacity, 0);
    }
}

function getMatrixMetadata(layout: Layout): {
    rows: number;
    columns: number;
    disabledCells: number;
    totalCells: number;
    availableCells: number;
} {
    const matrixNode =
        layout.nodes.find((node) => node.node_type === 'matrix') ?? null;
    const metadata = matrixNode?.metadata_json ?? {};
    const rows = numberValue(metadata.rows, 0);
    const columns = numberValue(metadata.columns, 0);
    const disabledCells = Array.isArray(metadata.disabled_cells)
        ? metadata.disabled_cells.length
        : 0;
    const totalCells = layout.nodes.filter((node) => node.node_type === 'cell').length;
    const availableCells = layout.nodes.filter(
        (node) => node.node_type === 'cell' && node.is_selectable,
    ).length;

    return {
        rows,
        columns,
        disabledCells,
        totalCells,
        availableCells,
    };
}

function getLayoutBadges(layout: Layout): LayoutBadge[] {
    switch (layout.template_type) {
        case 'matrix': {
            const matrix = getMatrixMetadata(layout);

            return [
                { label: 'Formato', value: `${matrix.rows} x ${matrix.columns}` },
                { label: 'Asientos', value: `${matrix.totalCells}` },
                { label: 'Disponibles', value: `${matrix.availableCells}` },
                { label: 'Bloqueados', value: `${matrix.disabledCells}` },
            ];
        }
        case 'mixed': {
            const sectors = getLayoutNodesByType(layout, 'sector').length;
            const tables = getLayoutNodesByType(layout, 'table').length;
            const seats = getLayoutNodesByType(layout, 'seat').length;

            return [
                { label: 'Sectores', value: `${sectors}` },
                { label: 'Mesas', value: `${tables}` },
                { label: 'Sillas', value: `${seats}` },
                { label: 'Disponibles', value: `${seats}` },
            ];
        }
        case 'sectors': {
            const sectors = getLayoutNodesByType(layout, 'sector');

            return [
                { label: 'Sectores', value: `${sectors.length}` },
                {
                    label: 'Capacidad',
                    value: `${sectors.reduce((sum, node) => sum + node.capacity, 0)}`,
                },
            ];
        }
        default:
            return [
                { label: 'Nodos técnicos', value: `${layout.nodes.length}` },
                { label: 'Capacidad', value: `${getLayoutCapacity(layout)}` },
            ];
    }
}

function getLayoutSubtitle(layout: Layout): string {
    switch (layout.template_type) {
        case 'matrix': {
            const matrix = getMatrixMetadata(layout);

            return `${matrix.rows} filas · ${matrix.columns} columnas · ${matrix.availableCells} disponibles`;
        }
        case 'mixed': {
            const sectors = getLayoutNodesByType(layout, 'sector').length;
            const tables = getLayoutNodesByType(layout, 'table').length;
            const seats = getLayoutNodesByType(layout, 'seat').length;

            return `${sectors} sectores · ${tables} mesas · ${seats} sillas`;
        }
        case 'sectors': {
            const sectors = getLayoutNodesByType(layout, 'sector');

            return `${sectors.length} sectores · ${sectors.reduce((sum, node) => sum + node.capacity, 0)} cupos`;
        }
        default:
            return `${layout.nodes.length} nodos · ${getLayoutCapacity(layout)} cupos`;
    }
}

function getMetadataEntries(
    metadata: Record<string, unknown> | null,
): Array<[string, unknown]> {
    if (metadata === null) {
        return [];
    }

    return Object.entries(metadata).filter(([, value]) => {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === 'string') {
            return value.trim() !== '';
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === 'object') {
            return Object.keys(value as Record<string, unknown>).length > 0;
        }

        return true;
    });
}

function getRelationDepth(node: LayoutTreeNode, depth = 1): number {
    if (node.children.length === 0) {
        return depth;
    }

    return Math.max(
        depth,
        ...node.children.map((child) => getRelationDepth(child, depth + 1)),
    );
}

function buildLayoutTree(nodes: LayoutNode[]): LayoutTreeNode[] {
    const sortedNodes = [...nodes].sort((left, right) => {
        if (left.sort_order === right.sort_order) {
            return left.external_key.localeCompare(right.external_key);
        }

        return left.sort_order - right.sort_order;
    });

    const nodesById = new Map<string, LayoutTreeNode>();

    for (const node of sortedNodes) {
        nodesById.set(node.id, { ...node, children: [] });
    }

    const roots: LayoutTreeNode[] = [];

    for (const node of sortedNodes) {
        const treeNode = nodesById.get(node.id);

        if (treeNode === undefined) {
            continue;
        }

        if (node.parent_id !== null) {
            const parent = nodesById.get(node.parent_id);

            if (parent !== undefined) {
                parent.children.push(treeNode);

                continue;
            }
        }

        roots.push(treeNode);
    }

    const sortTree = (items: LayoutTreeNode[]): LayoutTreeNode[] =>
        items
            .sort((left, right) => {
                if (left.sort_order === right.sort_order) {
                    return left.external_key.localeCompare(right.external_key);
                }

                return left.sort_order - right.sort_order;
            })
            .map((item) => ({
                ...item,
                children: sortTree(item.children),
            }));

    return sortTree(roots);
}

function LayoutPreviewCanvas({
    nodes,
    className = '',
    templateType = null,
}: {
    nodes: LayoutNode[];
    className?: string;
    templateType?: string | null;
}): JSX.Element {
    const sortedNodes = sortLayoutNodes(nodes);
    const nodesById = new Map(sortedNodes.map((node) => [node.id, node]));
    const nodesByParentId = sortedNodes.reduce<Map<string, LayoutNode[]>>((map, node) => {
        if (node.parent_id === null) {
            return map;
        }

        const siblings = map.get(node.parent_id) ?? [];
        siblings.push(node);
        map.set(node.parent_id, siblings);

        return map;
    }, new Map<string, LayoutNode[]>());
    const renderNodes =
        templateType === 'matrix'
            ? sortedNodes.filter((node) => node.node_type === 'cell')
            : sortedNodes;
    const renderGeometries = renderNodes.map((node) =>
        getRenderGeometry(node, nodesById, nodesByParentId, templateType),
    );
    const bounds = getBoundsFromGeometries(renderGeometries);

    return (
        <div
            className={[
                'relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-slate-50 shadow-[0_24px_70px_rgba(15,23,42,.18)]',
                className,
            ].join(' ')}
        >
            <div
                className={
                    'absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_45%)]'
                }
            />
            <div
                className={
                    'absolute inset-0 bg-[linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)] bg-[size:22px_22px] opacity-35'
                }
            />
            <div className={'absolute inset-4'}>
                {renderNodes.length === 0 ? (
                    <div className="grid h-full place-items-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 text-center text-sm text-slate-300">
                        <span>No hay nodos importados todavía.</span>
                    </div>
                ) : (
                    renderNodes.map((node, index) => {
                        const geometry = renderGeometries[index];
                        const widthPercent = (geometry.width / bounds.width) * 100;
                        const heightPercent = (geometry.height / bounds.height) * 100;
                        const mixedCircular =
                            templateType === 'mixed' &&
                            (node.node_type === 'seat' || node.node_type === 'table');
                        const minimumSize = mixedCircular ? 1.25 : 8;
                        const diameter = mixedCircular
                            ? Math.max(Math.min(widthPercent, heightPercent), minimumSize)
                            : undefined;
                        const width = mixedCircular
                            ? diameter
                            : Math.max(widthPercent, minimumSize);
                        const height = mixedCircular
                            ? diameter
                            : Math.max(heightPercent, minimumSize);
                        const left = ((geometry.x - bounds.minX) / bounds.width) * 100;
                        const top = ((geometry.y - bounds.minY) / bounds.height) * 100;
                        const safeLeft = Math.min(
                            Math.max(left, 0),
                            Math.max(100 - width, 0),
                        );
                        const safeTop = Math.min(
                            Math.max(top, 0),
                            Math.max(100 - height, 0),
                        );
                        const fill =
                            templateType === 'matrix'
                                ? node.is_selectable
                                    ? '#22c55e'
                                    : '#ef4444'
                                : node.node_type === 'seat' && templateType === 'mixed'
                                    ? '#a855f7'
                                    : node.node_type === 'table' && templateType === 'mixed'
                                        ? '#f59e0b'
                                        : getNodeFill(node);
                        const textColor = getReadableTextColor(fill);
                        const shouldShowContent =
                            templateType !== 'mixed' ||
                            (node.node_type !== 'seat' && node.node_type !== 'table');

                        return (
                            <article
                                key={node.id}
                                className={
                                    templateType === 'mixed' && node.node_type === 'seat'
                                        ? 'absolute flex items-center justify-center overflow-hidden rounded-full border border-white/20 shadow-[0_18px_40px_rgba(2,6,23,.24)] backdrop-blur-sm'
                                        : templateType === 'mixed' && node.node_type === 'table'
                                            ? 'absolute flex items-center justify-center overflow-hidden rounded-full border border-white/20 shadow-[0_18px_40px_rgba(2,6,23,.24)] backdrop-blur-sm'
                                            : 'absolute overflow-hidden rounded-2xl border border-white/20 shadow-[0_18px_40px_rgba(2,6,23,.24)] backdrop-blur-sm'
                                }
                                style={{
                                    left: `${safeLeft}%`,
                                    top: `${safeTop}%`,
                                    width: `${width}%`,
                                    height: `${height}%`,
                                    backgroundColor: fill,
                                    color: textColor,
                                    opacity: node.is_selectable ? 1 : 0.72,
                                }}
                            >
                                {templateType === 'matrix' || !shouldShowContent ? null : (
                                    <div className={'flex h-full flex-col justify-between gap-2 p-3'}>
                                        <div className={'space-y-1'}>
                                            <span
                                                className={
                                                    'inline-flex w-fit rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]'
                                                }
                                            >
                                                {formatNodeType(node.node_type)}
                                            </span>
                                            <h3 className={'truncate text-sm font-bold leading-tight'}>
                                                {node.label ?? node.external_key}
                                            </h3>
                                        </div>
                                        <div className={'space-y-1 text-[11px] font-medium'}>
                                            <div className={'flex items-center justify-between gap-2'}>
                                                <span>Cupos</span>
                                                <span>{node.capacity}</span>
                                            </div>
                                            <div className={'flex items-center justify-between gap-2'}>
                                                <span>Clave</span>
                                                <span className={'truncate'}>{node.external_key}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function LayoutRelationTree({
    nodes,
}: {
    nodes: LayoutTreeNode[];
}): JSX.Element {
    if (nodes.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                No hay relaciones jerárquicas definidas en este plano.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {nodes.map((node) => {
                const metadataEntries = getMetadataEntries(node.metadata_json);
                const geometry = getGeometry(node);

                return (
                    <div key={node.id} className="space-y-3">
                        <article className="rounded-2xl border bg-background p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                                            {formatNodeType(node.node_type)}
                                        </span>
                                        <span className="text-sm font-semibold">
                                            {node.label ?? node.external_key}
                                        </span>
                                        <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                            {node.parent_id ? 'Hijo' : 'Raíz'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Clave {node.external_key}
                                        {node.parent_id ? ' · enlazado a su padre' : ' · sin padre'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium">
                                        {node.capacity} cupos
                                    </span>
                                    <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium">
                                        {node.is_selectable ? 'Seleccionable' : 'Solo referencia'}
                                    </span>
                                    <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium">
                                        Modo {node.node_type}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                                <div className="space-y-2">
                                    <div className="rounded-xl bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                                        x {geometry.x} · y {geometry.y} · w {geometry.width} · h {geometry.height}
                                    </div>
                                    {metadataEntries.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {metadataEntries.map(([key, value]) => (
                                                <span
                                                    key={key}
                                                    className="rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium"
                                                >
                                                    {key}: {Array.isArray(value) ? `${value.length} ítems` : String(value)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Sin metadatos adicionales.
                                        </p>
                                    )}
                                </div>
                                <div className="rounded-2xl border bg-muted/20 p-3 text-sm">
                                    <p className="font-medium text-foreground">
                                        Relaciones directas
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        {node.children.length} nodos hijo{node.children.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </div>
                        </article>
                        {node.children.length > 0 && (
                            <div className="ml-5 border-l border-dashed pl-4">
                                <LayoutRelationTree nodes={node.children} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function Layouts({ layouts }: { layouts: Paginated<Layout> }) {
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(
        layouts.data[0]?.id ?? null,
    );
    const [composerOpen, setComposerOpen] = useState<boolean>(false);
    const [expandedOpen, setExpandedOpen] = useState<boolean>(false);

    useEffect(() => {
        if (layouts.data.length === 0) {
            setSelectedLayoutId(null);

            return;
        }

        if (!layouts.data.some((layout) => layout.id === selectedLayoutId)) {
            setSelectedLayoutId(layouts.data[0].id);
        }
    }, [layouts.data, selectedLayoutId]);

    const selectedLayout =
        layouts.data.find((layout) => layout.id === selectedLayoutId) ??
        layouts.data[0] ??
        null;
    const selectedTree = selectedLayout ? buildLayoutTree(selectedLayout.nodes) : [];
    const selectedSummaries = selectedLayout
        ? summarizeNodes(selectedLayout.nodes)
        : [];
    const selectedCapacity = selectedLayout ? getLayoutCapacity(selectedLayout) : 0;
    const selectableNodes = selectedLayout
        ? selectedLayout.nodes.filter((node) => node.is_selectable).length
        : 0;
    const relationDepth = selectedTree.length
        ? Math.max(...selectedTree.map((node) => getRelationDepth(node)))
        : 0;
    const rootNodes = selectedTree.length;
    const nestedNodes = selectedLayout ? selectedLayout.nodes.length - rootNodes : 0;
    const selectedBadges = selectedLayout ? getLayoutBadges(selectedLayout) : [];

    function openExpandedLayout(layoutId: string): void {
        setSelectedLayoutId(layoutId);
        setExpandedOpen(true);
    }

    return (
        <>
            <Head title="Planos" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <PageHeader
                    eyebrow="Configuración de recintos"
                    title="Plantillas de planos"
                    description="Importa JSON versionado y revisa cada plantilla con sus relaciones, geometría y metadatos reales."
                />
                <div className="flex justify-end">
                    <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus />
                                Crear plantilla
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Crear o importar plantilla</DialogTitle>
                                <DialogDescription>
                                    Define una plantilla por sectores, matriz o modo mixto, o carga un JSON legado.
                                </DialogDescription>
                            </DialogHeader>
                            <LayoutTemplateComposer onSaved={() => setComposerOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="grid gap-6">
                    <Panel>
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold">
                                        Plantillas registradas
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Miniaturas escaladas con la composición real de cada plano.
                                    </p>
                                </div>
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {layouts.data.length} en esta página
                                </span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {layouts.data.map((layout) => {
                                    const isSelected =
                                        layout.id === selectedLayout?.id;

                                    return (
                                        <article
                                            key={layout.id}
                                            className={[
                                                'rounded-2xl border p-4 transition',
                                                isSelected
                                                    ? 'border-primary/60 bg-primary/5 shadow-sm'
                                                    : 'border-border bg-background hover:border-primary/30 hover:bg-accent/20',
                                            ].join(' ')}
                                        >
                                            <div className="flex justify-between gap-3">
                                                <span className="rounded-xl bg-primary/10 p-3 text-primary">
                                                    <MapIcon />
                                                </span>
                                                <StateBadge status={layout.status} />
                                            </div>
                                            <h3 className="mt-4 font-bold">
                                                {layout.name}{' '}
                                                <span className="text-muted-foreground">
                                                    v{layout.version}
                                                </span>
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {getLayoutSubtitle(layout)} · schema{' '}
                                                {layout.schema_version}
                                            </p>
                                            <div className="mt-4">
                                                <LayoutPreviewCanvas
                                                    nodes={layout.nodes}
                                                    className="h-44"
                                                    templateType={layout.template_type}
                                                />
                                            </div>
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                                                <small className="text-muted-foreground">
                                                    {dateTime(layout.created_at)}
                                                </small>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openExpandedLayout(layout.id)}
                                                    >
                                                        Ver ampliado
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.patch(
                                                                layoutsRoutes.toggle(
                                                                    layout.id,
                                                                ).url,
                                                            )
                                                        }
                                                    >
                                                        {layout.status === 'active'
                                                            ? 'Desactivar'
                                                            : 'Activar'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            <Pagination page={layouts} />
                        </div>
                    </Panel>
                    <div className="hidden space-y-6">
                        <Panel
                            title="Vista ampliada"
                            description="Aquí se muestran las relaciones padre-hijo, la geometría y los metadatos del plano seleccionado."
                        >
                            {selectedLayout ? (
                                <div className="space-y-4">
                                    <div className="hidden flex flex-wrap gap-2">
                                        <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                            {selectedLayout.nodes_count} nodos
                                        </span>
                                        <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                            {selectedCapacity} cupos
                                        </span>
                                        <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                            {selectableNodes} seleccionables
                                        </span>
                                        <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                            {rootNodes} raíces
                                        </span>
                                        <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                            {nestedNodes} hijos
                                        </span>
                                        <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                            Profundidad {relationDepth}
                                        </span>
                                        <StateBadge status={selectedLayout.status} />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedBadges.map((badge) => (
                                            <span
                                                key={badge.label}
                                                className="rounded-full border px-3 py-1 text-xs font-medium"
                                            >
                                                {badge.label}: {badge.value}
                                            </span>
                                        ))}
                                        <StateBadge status={selectedLayout.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedLayout.nodes.length} nodos técnicos · {selectedCapacity} cupos útiles
                                    </p>
                                    <LayoutPreviewCanvas
                                        nodes={selectedLayout.nodes}
                                        className="h-[28rem]"
                                        templateType={selectedLayout.template_type}
                                    />
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {selectedSummaries.map((summary) => (
                                            <span
                                                key={summary.label}
                                                className="rounded-xl border bg-muted/40 px-3 py-2 text-sm"
                                            >
                                                {summary.label} · {summary.count}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                            Relaciones del plano
                                        </h3>
                                        <LayoutRelationTree nodes={selectedTree} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
                                    <div className="space-y-2">
                                        <p className="font-semibold">
                                            No hay planos cargados.
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Importa un JSON para empezar a ver la composición del recinto.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Panel>
                    </div>
                </div>
            </div>
            <Dialog open={expandedOpen} onOpenChange={setExpandedOpen}>
                <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Vista ampliada</DialogTitle>
                        <DialogDescription>
                            Aqui se muestran la geometria y los metadatos del plano seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLayout ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                    {selectedLayout.nodes_count} nodos
                                </span>
                                <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                    {selectedCapacity} cupos
                                </span>
                                <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                    {selectableNodes} seleccionables
                                </span>
                                <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                    {rootNodes} raices
                                </span>
                                <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                    {nestedNodes} hijos
                                </span>
                                <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                    Profundidad {relationDepth}
                                </span>
                                <StateBadge status={selectedLayout.status} />
                            </div>
                            <LayoutPreviewCanvas
                                nodes={selectedLayout.nodes}
                                className="h-[28rem]"
                                templateType={selectedLayout.template_type}
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                                {selectedSummaries.map((summary) => (
                                    <span
                                        key={summary.label}
                                        className="rounded-xl border bg-muted/40 px-3 py-2 text-sm"
                                    >
                                        {summary.label} - {summary.count}
                                    </span>
                                ))}
                            </div>
                            <div className="hidden space-y-3">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Relaciones del plano
                                </h3>
                                <LayoutRelationTree nodes={selectedTree} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
                            <div className="space-y-2">
                                <p className="font-semibold">No hay planos cargados.</p>
                                <p className="text-sm text-muted-foreground">
                                    Importa un JSON para empezar a ver la composicion del recinto.
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

Layouts.layout = {
    breadcrumbs: [{ title: 'Planos', href: layoutsRoutes.index() }],
};
