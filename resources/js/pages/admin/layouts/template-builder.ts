export type TemplateType = 'sectors' | 'matrix' | 'mixed';

export type PreviewNode = {
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

export type SectorDraft = {
    key: string;
    label: string;
    price: string;
    capacity: string;
    color: string;
};

export type MatrixDraft = {
    rows: string;
    columns: string;
    price: string;
    disabled_cells: string[];
};

export type MixedTableDraft = {
    key: string;
    label: string;
    chairs: string;
};

export type MixedSectorDraft = {
    key: string;
    label: string;
    price: string;
    color: string;
    tables: MixedTableDraft[];
};

export type LayoutTemplateForm = {
    mode: 'create';
    name: string;
    template_type: TemplateType;
    sectors: SectorDraft[];
    matrix: MatrixDraft;
    mixed: { sectors: MixedSectorDraft[] };
};

const SECTOR_FILLS = ['#06b6d4', '#f59e0b', '#a855f7', '#22c55e', '#ef4444'];

function normalizeMoney(value: string): string {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

function sectorColor(index: number, color?: string): string {
    if (typeof color === 'string' && color.trim() !== '') {
        return color.trim();
    }

    return SECTOR_FILLS[index % SECTOR_FILLS.length];
}

export function createSectorDraft(index: number): SectorDraft {
    const sectorNumber = index + 1;

    return {
        key: `sector-${sectorNumber}`,
        label: `Sector ${sectorNumber}`,
        price: '120.00',
        capacity: '100',
        color: sectorColor(index),
    };
}

export function createMatrixDraft(): MatrixDraft {
    return {
        rows: '8',
        columns: '12',
        price: '75.00',
        disabled_cells: ['1-1', '1-2', '8-11'],
    };
}

export function createMixedTableDraft(index: number): MixedTableDraft {
    const tableNumber = index + 1;

    return {
        key: `table-${tableNumber}`,
        label: `Mesa ${tableNumber}`,
        chairs: '6',
    };
}

export function createMixedSectorDraft(index: number): MixedSectorDraft {
    const sectorNumber = index + 1;

    return {
        key: `sector-${sectorNumber}`,
        label: `Sector ${sectorNumber}`,
        price: '180.00',
        color: sectorColor(index),
        tables: [createMixedTableDraft(0)],
    };
}

export function createLayoutTemplateForm(): LayoutTemplateForm {
    return {
        mode: 'create',
        name: '',
        template_type: 'sectors',
        sectors: [createSectorDraft(0)],
        matrix: createMatrixDraft(),
        mixed: { sectors: [createMixedSectorDraft(0)] },
    };
}

export function buildPreviewNodes(form: LayoutTemplateForm): PreviewNode[] {
    if (form.template_type === 'matrix') {
        return buildMatrixNodes(form.matrix);
    }

    if (form.template_type === 'mixed') {
        return buildMixedNodes(form.mixed.sectors);
    }

    return buildSectorNodes(form.sectors);
}

function buildSectorNodes(sectors: SectorDraft[]): PreviewNode[] {
    return sectors
        .filter((sector) => sector.key.trim() !== '')
        .map<PreviewNode>((sector, index) => ({
            id: sector.key,
            parent_id: null,
            external_key: sector.key,
            node_type: 'sector',
            label: sector.label,
            capacity: Number(sector.capacity) || 1,
            is_selectable: true,
            geometry_json: {
                x: 30 + (index * 220),
                y: 40,
                width: 180,
                height: 130,
            },
            style_json: { fill: sectorColor(index, sector.color) },
            metadata_json: { price: normalizeMoney(sector.price) },
            sort_order: index,
        }));
}

function buildMatrixNodes(matrix: MatrixDraft): PreviewNode[] {
    const rows = Math.max(Number(matrix.rows) || 1, 1);
    const columns = Math.max(Number(matrix.columns) || 1, 1);
    const disabledLookup = new Set(matrix.disabled_cells);
    const nodes: PreviewNode[] = [
        {
            id: 'matrix',
            parent_id: null,
            external_key: 'matrix',
            node_type: 'matrix',
            label: 'Matriz',
            capacity: rows * columns,
            is_selectable: false,
            geometry_json: {
                x: 20,
                y: 20,
                width: columns * 72,
                height: rows * 72,
            },
            style_json: { fill: '#0f172a' },
            metadata_json: {
                price: normalizeMoney(matrix.price),
                rows,
                columns,
                disabled_cells: [...disabledLookup],
            },
            sort_order: 0,
        },
    ];

    for (let row = 1; row <= rows; row += 1) {
        const rowKey = `row-${row}`;
        nodes.push({
            id: rowKey,
            parent_id: 'matrix',
            external_key: rowKey,
            node_type: 'row',
            label: `Fila ${row}`,
            capacity: columns,
            is_selectable: false,
            geometry_json: {
                x: 24,
                y: 28 + ((row - 1) * 72),
                width: columns * 64,
                height: 56,
            },
            style_json: { fill: '#1e293b' },
            metadata_json: { row },
            sort_order: row,
        });

        for (let column = 1; column <= columns; column += 1) {
            const cellKey = `${row}-${column}`;
            const disabled = disabledLookup.has(cellKey);

            nodes.push({
                id: `cell-${cellKey}`,
                parent_id: rowKey,
                external_key: `cell-${cellKey}`,
                node_type: 'cell',
                label: `Asiento ${cellKey}`,
                capacity: 1,
                is_selectable: !disabled,
                geometry_json: {
                    x: 32 + ((column - 1) * 64),
                    y: 36 + ((row - 1) * 72),
                    width: 52,
                    height: 44,
                },
                style_json: { fill: disabled ? '#ef4444' : '#22c55e' },
                metadata_json: {
                    row,
                    column,
                    price: normalizeMoney(matrix.price),
                    disabled,
                },
                sort_order: (row * 100) + column,
            });
        }
    }

    return nodes;
}

function buildMixedNodes(sectors: MixedSectorDraft[]): PreviewNode[] {
    const nodes: PreviewNode[] = [];

    sectors
        .filter((sector) => sector.key.trim() !== '')
        .forEach((sector, sectorIndex) => {
            const price = normalizeMoney(sector.price);
            const sectorKey = `sector-${sector.key}`;
            const sectorGeometry = {
                x: 20 + (sectorIndex * 320),
                y: 30,
                width: 280,
                height: 260,
            };
            let sectorCapacity = 0;

            nodes.push({
                id: sectorKey,
                parent_id: null,
                external_key: sectorKey,
                node_type: 'sector',
                label: sector.label,
                capacity: 0,
                is_selectable: false,
                geometry_json: sectorGeometry,
                style_json: { fill: sectorColor(sectorIndex, sector.color) },
                metadata_json: { price },
                sort_order: sectorIndex * 100,
            });

            sector.tables
                .filter((table) => table.key.trim() !== '')
                .forEach((table, tableIndex) => {
                    const chairs = Math.max(Number(table.chairs) || 1, 1);
                    sectorCapacity += chairs;
                    const tableKey = `table-${sector.key}-${table.key}`;
                    const tableGeometry = {
                        x: sectorGeometry.x + 18 + ((tableIndex % 2) * 118),
                        y: sectorGeometry.y + 48 + (Math.floor(tableIndex / 2) * 92),
                        width: 94,
                        height: 64,
                    };

                    nodes.push({
                        id: tableKey,
                        parent_id: sectorKey,
                        external_key: tableKey,
                        node_type: 'table',
                        label: table.label,
                        capacity: chairs,
                        is_selectable: false,
                        geometry_json: tableGeometry,
                        style_json: { fill: '#f59e0b' },
                        metadata_json: { price, chairs },
                        sort_order: sectorIndex * 100 + (tableIndex + 1) * 10,
                    });

                    for (let chairIndex = 1; chairIndex <= chairs; chairIndex += 1) {
                        nodes.push({
                            id: `seat-${sector.key}-${table.key}-${chairIndex}`,
                            parent_id: tableKey,
                            external_key: `seat-${sector.key}-${table.key}-${chairIndex}`,
                            node_type: 'seat',
                            label: `Silla ${chairIndex}`,
                            capacity: 1,
                            is_selectable: true,
                            geometry_json: {
                                x: tableGeometry.x + 8 + ((chairIndex - 1) * 15),
                                y: tableGeometry.y + 30,
                                width: 12,
                                height: 12,
                            },
                            style_json: { fill: '#a855f7' },
                            metadata_json: { price },
                            sort_order: sectorIndex * 100 + (tableIndex + 1) * 10 + chairIndex,
                        });
                    }
                });

            const sectorNode = nodes.find((node) => node.id === sectorKey);

            if (sectorNode !== undefined) {
                sectorNode.capacity = sectorCapacity;
                sectorNode.metadata_json = { ...(sectorNode.metadata_json ?? {}), price, tables: sector.tables.length };
            }
        });

    return nodes;
}
