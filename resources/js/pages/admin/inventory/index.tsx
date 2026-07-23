import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Search, SlidersHorizontal } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    FieldError,
    PageHeader,
    Pagination,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dateTime } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import inventoryRoutes from '@/routes/admin/inventory';

type Variant = {
    id: string;
    name: string | null;
    sku: string;
    low_stock_threshold: number;
    product: { name: string };
    inventory: {
        on_hand_quantity: number;
        reserved_quantity: number;
        available_quantity: number;
    } | null;
};
type Alert = {
    id: string;
    alert_type: string;
    quantity_at_open: number;
    status: string;
    opened_at: string;
    variant: Variant;
};
type Movement = {
    id: string;
    movement_type: string;
    on_hand_delta: number;
    reserved_delta: number;
    created_at: string;
    variant: Variant;
};

export default function Inventory({
    variants,
    alerts,
    movements,
    filters,
}: {
    variants: Paginated<Variant>;
    alerts: Alert[];
    movements: Movement[];
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const form = useForm({
        product_variant_id: variants.data[0]?.id ?? '',
        quantity_delta: 1,
        adjustment_type: 'entry',
        reason: '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(inventoryRoutes.adjust().url, {
            onSuccess: () => form.reset('reason'),
        });
    };

    return (
        <>
            <Head title={'Inventario'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Stock'}
                    title={'Inventario'}
                    description={
                        'Disponibilidad calculada, reservas activas, alertas y trazabilidad de movimientos.'
                    }
                />
                <div className={'grid gap-6 xl:grid-cols-[1fr_360px]'}>
                    <div className={'space-y-6'}>
                        <Panel>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    router.get(
                                        inventoryRoutes.index().url,
                                        { search },
                                        { preserveState: true },
                                    );
                                }}
                                className={'mb-5 flex gap-2'}
                            >
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={'Producto o SKU'}
                                />
                                <Button variant={'outline'}>
                                    <Search />
                                </Button>
                            </form>
                            <div className={'overflow-x-auto'}>
                                <table className={'w-full text-sm'}>
                                    <thead>
                                        <tr
                                            className={
                                                'border-b text-left text-muted-foreground'
                                            }
                                        >
                                            <th className={'pb-3'}>Producto</th>
                                            <th>En mano</th>
                                            <th>Reservado</th>
                                            <th>Disponible</th>
                                            <th>Mínimo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.data.map((variant) => (
                                            <tr
                                                key={variant.id}
                                                className={
                                                    'border-b last:border-0'
                                                }
                                            >
                                                <td className={'py-4'}>
                                                    <strong>
                                                        {variant.product.name}
                                                    </strong>
                                                    <small
                                                        className={
                                                            'block text-muted-foreground'
                                                        }
                                                    >
                                                        {variant.name} ·{' '}
                                                        {variant.sku}
                                                    </small>
                                                </td>
                                                <td>
                                                    {variant.inventory
                                                        ?.on_hand_quantity ?? 0}
                                                </td>
                                                <td>
                                                    {variant.inventory
                                                        ?.reserved_quantity ??
                                                        0}
                                                </td>
                                                <td className={'font-black'}>
                                                    {variant.inventory
                                                        ?.available_quantity ??
                                                        0}
                                                </td>
                                                <td>
                                                    {
                                                        variant.low_stock_threshold
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={variants} />
                        </Panel>
                        <Panel title={'Últimos movimientos'}>
                            <div className={'space-y-2'}>
                                {movements.map((movement) => (
                                    <div
                                        key={movement.id}
                                        className={
                                            'flex items-center justify-between rounded-lg border p-3 text-sm'
                                        }
                                    >
                                        <div
                                            className={
                                                'flex items-center gap-3'
                                            }
                                        >
                                            {movement.on_hand_delta >= 0 ? (
                                                <ArrowUp
                                                    className={
                                                        'text-emerald-500'
                                                    }
                                                />
                                            ) : (
                                                <ArrowDown
                                                    className={'text-red-500'}
                                                />
                                            )}
                                            <span>
                                                {movement.variant.product.name}
                                                <small
                                                    className={
                                                        'block text-muted-foreground'
                                                    }
                                                >
                                                    {movement.movement_type} ·{' '}
                                                    {dateTime(
                                                        movement.created_at,
                                                    )}
                                                </small>
                                            </span>
                                        </div>
                                        <strong>
                                            {movement.on_hand_delta > 0
                                                ? '+'
                                                : ''}
                                            {movement.on_hand_delta}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>
                    <div className={'space-y-6'}>
                        <Panel title={'Ajuste manual'}>
                            <form onSubmit={submit} className={'space-y-4'}>
                                <div>
                                    <Label>Variante</Label>
                                    <select
                                        className={
                                            'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                        }
                                        value={form.data.product_variant_id}
                                        onChange={(e) =>
                                            form.setData(
                                                'product_variant_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {variants.data.map((variant) => (
                                            <option
                                                key={variant.id}
                                                value={variant.id}
                                            >
                                                {variant.product.name} ·{' '}
                                                {variant.sku}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={'grid grid-cols-2 gap-3'}>
                                    <div>
                                        <Label>Cantidad (+/-)</Label>
                                        <Input
                                            type={'number'}
                                            value={form.data.quantity_delta}
                                            onChange={(e) =>
                                                form.setData(
                                                    'quantity_delta',
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Tipo</Label>
                                        <select
                                            className={
                                                'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                            }
                                            value={form.data.adjustment_type}
                                            onChange={(e) =>
                                                form.setData(
                                                    'adjustment_type',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value={'entry'}>
                                                Entrada
                                            </option>
                                            <option value={'exit'}>
                                                Salida
                                            </option>
                                            <option value={'correction'}>
                                                Corrección
                                            </option>
                                            <option value={'manual'}>
                                                Manual
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Label>Motivo</Label>
                                    <Textarea
                                        value={form.data.reason}
                                        onChange={(e) =>
                                            form.setData(
                                                'reason',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <FieldError message={form.errors.reason} />
                                </div>
                                <Button
                                    className={'w-full'}
                                    disabled={form.processing}
                                >
                                    <SlidersHorizontal />
                                    Registrar ajuste
                                </Button>
                            </form>
                        </Panel>
                        <Panel title={'Alertas abiertas'}>
                            <div className={'space-y-3'}>
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={
                                            'rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm'
                                        }
                                    >
                                        <div className={'flex justify-between'}>
                                            <strong>
                                                {alert.variant.product.name}
                                            </strong>
                                            <StateBadge status={alert.status} />
                                        </div>
                                        <p
                                            className={
                                                'mt-1 text-muted-foreground'
                                            }
                                        >
                                            {alert.quantity_at_open} disponibles
                                            · mínimo{' '}
                                            {alert.variant.low_stock_threshold}
                                        </p>
                                    </div>
                                ))}
                                {alerts.length === 0 && (
                                    <p
                                        className={
                                            'text-sm text-muted-foreground'
                                        }
                                    >
                                        Sin alertas abiertas.
                                    </p>
                                )}
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </>
    );
}

Inventory.layout = {
    breadcrumbs: [{ title: 'Inventario', href: inventoryRoutes.index() }],
};
