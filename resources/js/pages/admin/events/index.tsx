import { Head, router, useForm } from '@inertiajs/react';
import { CalendarPlus, Search } from 'lucide-react';
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
import { dateTime, money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import eventsRoutes from '@/routes/admin/events';

type EventItem = {
    id: string;
    name: string;
    public_code: string;
    status: string;
    venue_name: string;
    city: string | null;
    category: { name: string } | null;
    occurrences: { starts_at: string; status: string }[];
};

export default function AdminEvents({
    events,
    categories,
    layouts,
    filters,
}: {
    events: Paginated<EventItem>;
    categories: { id: string; name: string }[];
    layouts: { id: string; name: string; version: number }[];
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const form = useForm({
        name: '',
        event_category_id: '',
        layout_template_id: layouts[0]?.id ?? '',
        short_description: '',
        description: '',
        venue_name: '',
        venue_address: '',
        city: '',
        starts_at: '',
        ends_at: '',
        sales_start_at: '',
        sales_end_at: '',
        status: 'published',
        ticket_types: [
            {
                name: 'General',
                code: 'GENERAL',
                base_price: '100.00',
                quota_total: 100,
            },
        ],
    });
    const promotionForm = useForm({
        event_id: events.data[0]?.id ?? '',
        code: '',
        discount_type: 'percentage',
        discount_value: '10.00',
        minimum_amount: '',
        maximum_discount: '',
        maximum_redemptions: '',
        starts_at: '',
        ends_at: '',
    });
    const filter = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            eventsRoutes.index().url,
            { search },
            { preserveState: true, replace: true },
        );
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(eventsRoutes.store().url, { onSuccess: () => form.reset() });
    };
    const submitPromotion = (event: FormEvent) => {
        event.preventDefault();
        promotionForm.post(
            eventsRoutes.promotions.store(promotionForm.data.event_id).url,
            { onSuccess: () => promotionForm.reset('code') },
        );
    };

    return (
        <>
            <Head title={'Eventos'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Boletería'}
                    title={'Eventos'}
                    description={
                        'Crea funciones, instancia planos y define el cupo comercial inicial.'
                    }
                />
                <div className={'grid gap-6 xl:grid-cols-[1fr_420px]'}>
                    <Panel>
                        <form onSubmit={filter} className={'mb-5 flex gap-2'}>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={'Buscar evento'}
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
                                        <th className={'pb-3'}>Evento</th>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                        <th>Lugar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={'border-b last:border-0'}
                                        >
                                            <td className={'py-4'}>
                                                <strong>{item.name}</strong>
                                                <small
                                                    className={
                                                        'block text-muted-foreground'
                                                    }
                                                >
                                                    {item.public_code} ·{' '}
                                                    {item.category?.name}
                                                </small>
                                            </td>
                                            <td>
                                                {item.occurrences[0]
                                                    ? dateTime(
                                                          item.occurrences[0]
                                                              .starts_at,
                                                      )
                                                    : 'Sin función'}
                                            </td>
                                            <td>
                                                <div className={'space-y-2'}>
                                                    <StateBadge
                                                        status={item.status}
                                                    />
                                                    <select
                                                        value={item.status}
                                                        onChange={(event) =>
                                                            router.patch(
                                                                eventsRoutes.status(
                                                                    item.id,
                                                                ).url,
                                                                {
                                                                    status: event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                        className={
                                                            'block h-8 rounded-md border bg-background px-2 text-xs'
                                                        }
                                                    >
                                                        <option value={'draft'}>
                                                            Borrador
                                                        </option>
                                                        <option
                                                            value={'published'}
                                                        >
                                                            Publicado
                                                        </option>
                                                        <option
                                                            value={'finished'}
                                                        >
                                                            Finalizado
                                                        </option>
                                                        <option
                                                            value={'cancelled'}
                                                        >
                                                            Cancelado
                                                        </option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                {item.venue_name}
                                                <small
                                                    className={
                                                        'block text-muted-foreground'
                                                    }
                                                >
                                                    {item.city}
                                                </small>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={events} />
                    </Panel>
                    <Panel
                        title={'Nuevo evento'}
                        description={
                            'Se creará una función con plano e inventario.'
                        }
                    >
                        <form onSubmit={submit} className={'space-y-4'}>
                            <div>
                                <Label>Nombre</Label>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                />
                                <FieldError message={form.errors.name} />
                            </div>
                            <div className={'grid grid-cols-2 gap-3'}>
                                <div>
                                    <Label>Categoría</Label>
                                    <select
                                        className={
                                            'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                        }
                                        value={form.data.event_category_id}
                                        onChange={(e) =>
                                            form.setData(
                                                'event_category_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value={''}>
                                            Sin categoría
                                        </option>
                                        {categories.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Plano</Label>
                                    <select
                                        className={
                                            'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                        }
                                        value={form.data.layout_template_id}
                                        onChange={(e) =>
                                            form.setData(
                                                'layout_template_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {layouts.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.name} v{item.version}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <Label>Descripción corta</Label>
                                <Textarea
                                    value={form.data.short_description}
                                    onChange={(e) =>
                                        form.setData(
                                            'short_description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className={'grid grid-cols-2 gap-3'}>
                                <div>
                                    <Label>Lugar</Label>
                                    <Input
                                        value={form.data.venue_name}
                                        onChange={(e) =>
                                            form.setData(
                                                'venue_name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Ciudad</Label>
                                    <Input
                                        value={form.data.city}
                                        onChange={(e) =>
                                            form.setData('city', e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Dirección</Label>
                                <Input
                                    value={form.data.venue_address}
                                    onChange={(e) =>
                                        form.setData(
                                            'venue_address',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className={'grid grid-cols-2 gap-3'}>
                                <div>
                                    <Label>Inicio</Label>
                                    <Input
                                        type={'datetime-local'}
                                        value={form.data.starts_at}
                                        onChange={(e) =>
                                            form.setData(
                                                'starts_at',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Fin</Label>
                                    <Input
                                        type={'datetime-local'}
                                        value={form.data.ends_at}
                                        onChange={(e) =>
                                            form.setData(
                                                'ends_at',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div className={'rounded-lg border p-4'}>
                                <p className={'mb-3 text-sm font-bold'}>
                                    Entrada inicial
                                </p>
                                <div className={'grid grid-cols-2 gap-3'}>
                                    <Input
                                        placeholder={'Nombre'}
                                        value={form.data.ticket_types[0].name}
                                        onChange={(e) =>
                                            form.setData('ticket_types', [
                                                {
                                                    ...form.data
                                                        .ticket_types[0],
                                                    name: e.target.value,
                                                },
                                            ])
                                        }
                                    />
                                    <Input
                                        placeholder={'Código'}
                                        value={form.data.ticket_types[0].code}
                                        onChange={(e) =>
                                            form.setData('ticket_types', [
                                                {
                                                    ...form.data
                                                        .ticket_types[0],
                                                    code: e.target.value,
                                                },
                                            ])
                                        }
                                    />
                                    <Input
                                        type={'number'}
                                        step={'0.01'}
                                        placeholder={'Precio'}
                                        value={
                                            form.data.ticket_types[0].base_price
                                        }
                                        onChange={(e) =>
                                            form.setData('ticket_types', [
                                                {
                                                    ...form.data
                                                        .ticket_types[0],
                                                    base_price: e.target.value,
                                                },
                                            ])
                                        }
                                    />
                                    <Input
                                        type={'number'}
                                        placeholder={'Cupo'}
                                        value={
                                            form.data.ticket_types[0]
                                                .quota_total
                                        }
                                        onChange={(e) =>
                                            form.setData('ticket_types', [
                                                {
                                                    ...form.data
                                                        .ticket_types[0],
                                                    quota_total: Number(
                                                        e.target.value,
                                                    ),
                                                },
                                            ])
                                        }
                                    />
                                </div>
                                <p
                                    className={
                                        'mt-2 text-xs text-muted-foreground'
                                    }
                                >
                                    {money(
                                        form.data.ticket_types[0].base_price,
                                    )}{' '}
                                    · {form.data.ticket_types[0].quota_total}{' '}
                                    unidades
                                </p>
                            </div>
                            <div>
                                <Label>Estado</Label>
                                <select
                                    className={
                                        'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                    }
                                    value={form.data.status}
                                    onChange={(e) =>
                                        form.setData('status', e.target.value)
                                    }
                                >
                                    <option value={'published'}>
                                        Publicado
                                    </option>
                                    <option value={'draft'}>Borrador</option>
                                </select>
                            </div>
                            {Object.values(form.errors).map((error) => (
                                <FieldError
                                    key={error as string}
                                    message={error as string}
                                />
                            ))}
                            <Button
                                className={'w-full'}
                                disabled={form.processing}
                            >
                                <CalendarPlus />
                                Crear evento
                            </Button>
                        </form>
                    </Panel>
                </div>
                <Panel
                    title={'Nuevo codigo promocional'}
                    description={
                        'Aplica descuentos porcentuales o fijos durante una ventana de venta.'
                    }
                >
                    <form
                        onSubmit={submitPromotion}
                        className={'grid gap-4 md:grid-cols-4'}
                    >
                        <div>
                            <Label>Evento</Label>
                            <select
                                value={promotionForm.data.event_id}
                                onChange={(event) =>
                                    promotionForm.setData(
                                        'event_id',
                                        event.target.value,
                                    )
                                }
                                className={
                                    'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                }
                            >
                                {events.data.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Codigo</Label>
                            <Input
                                value={promotionForm.data.code}
                                onChange={(event) =>
                                    promotionForm.setData(
                                        'code',
                                        event.target.value.toUpperCase(),
                                    )
                                }
                            />
                            <FieldError message={promotionForm.errors.code} />
                        </div>
                        <div>
                            <Label>Tipo</Label>
                            <select
                                value={promotionForm.data.discount_type}
                                onChange={(event) =>
                                    promotionForm.setData(
                                        'discount_type',
                                        event.target.value,
                                    )
                                }
                                className={
                                    'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                }
                            >
                                <option value={'percentage'}>Porcentaje</option>
                                <option value={'fixed'}>Monto fijo</option>
                            </select>
                        </div>
                        <div>
                            <Label>Valor</Label>
                            <Input
                                type={'number'}
                                min={'0.01'}
                                step={'0.01'}
                                value={promotionForm.data.discount_value}
                                onChange={(event) =>
                                    promotionForm.setData(
                                        'discount_value',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <Label>Compra minima</Label>
                            <Input
                                type={'number'}
                                min={'0'}
                                step={'0.01'}
                                value={promotionForm.data.minimum_amount}
                                onChange={(event) =>
                                    promotionForm.setData(
                                        'minimum_amount',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <Label>Descuento maximo</Label>
                            <Input
                                type={'number'}
                                min={'0'}
                                step={'0.01'}
                                value={promotionForm.data.maximum_discount}
                                onChange={(event) =>
                                    promotionForm.setData(
                                        'maximum_discount',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <Label>Usos maximos</Label>
                            <Input
                                type={'number'}
                                min={'1'}
                                value={promotionForm.data.maximum_redemptions}
                                onChange={(event) =>
                                    promotionForm.setData(
                                        'maximum_redemptions',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className={'flex items-end'}>
                            <Button
                                className={'w-full'}
                                disabled={
                                    promotionForm.processing ||
                                    !promotionForm.data.event_id
                                }
                            >
                                Crear promocion
                            </Button>
                        </div>
                    </form>
                </Panel>
            </div>
        </>
    );
}

AdminEvents.layout = {
    breadcrumbs: [{ title: 'Eventos', href: eventsRoutes.index() }],
};
