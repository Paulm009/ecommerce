import { Head, router, useForm } from '@inertiajs/react';
import { CalendarPlus, Search, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
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
import eventsRoutes from '@/routes/admin/events';

const toDateTimeLocalInput = (value: string | null): string => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 16);
};

type EventItem = {
    id: string;
    event_category_id: string | null;
    name: string;
    public_code: string;
    slug: string;
    short_description: string | null;
    description: string | null;
    status: string;
    venue_name: string;
    venue_address: string | null;
    city: string | null;
    cover_image_url: string | null;
    category: { name: string } | null;
    occurrences: {
        id: string;
        starts_at: string;
        ends_at: string | null;
        sales_start_at: string | null;
        sales_end_at: string | null;
        status: string;
        layout: { layout_template_id: string } | null;
    }[];
};

type EventFormData = {
    _method: 'POST' | 'PATCH';
    name: string;
    event_category_id: string;
    layout_template_id: string;
    short_description: string;
    description: string;
    cover_image: File | null;
    venue_name: string;
    venue_address: string;
    city: string;
    starts_at: string;
    ends_at: string;
    sales_start_at: string;
    sales_end_at: string;
    status: 'draft' | 'published' | 'finished' | 'cancelled';
};

export default function AdminEvents({
    events,
    categories,
    layouts,
    filters,
}: {
    events: Paginated<EventItem>;
    categories: { id: string; name: string }[];
    layouts: { id: string; name: string; version: number; status: string }[];
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
    const coverInputRef = useRef<HTMLInputElement | null>(null);
    const form = useForm<EventFormData>({
        _method: 'POST',
        name: '',
        event_category_id: '',
        layout_template_id: layouts[0]?.id ?? '',
        short_description: '',
        description: '',
        cover_image: null as File | null,
        venue_name: '',
        venue_address: '',
        city: '',
        starts_at: '',
        ends_at: '',
        sales_start_at: '',
        sales_end_at: '',
        status: 'published',
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
    const resetEventForm = (): void => {
        setEditingEventId(null);
        setCurrentCoverUrl(null);
        form.reset();
    };
    const openCoverPicker = (): void => {
        coverInputRef.current?.click();
    };
    const editEvent = (event: EventItem): void => {
        setEditingEventId(event.id);
        setCurrentCoverUrl(event.cover_image_url);
        form.setData('_method', 'PATCH');
        form.setData('name', event.name);
        form.setData('event_category_id', event.event_category_id ?? '');
        form.setData(
            'layout_template_id',
            event.occurrences[0]?.layout?.layout_template_id ??
                layouts[0]?.id ??
                '',
        );
        form.setData('short_description', event.short_description ?? '');
        form.setData('description', event.description ?? '');
        form.setData('cover_image', null);
        form.setData('venue_name', event.venue_name);
        form.setData('venue_address', event.venue_address ?? '');
        form.setData('city', event.city ?? '');
        form.setData(
            'starts_at',
            toDateTimeLocalInput(event.occurrences[0]?.starts_at ?? null),
        );
        form.setData(
            'ends_at',
            toDateTimeLocalInput(event.occurrences[0]?.ends_at ?? null),
        );
        form.setData(
            'sales_start_at',
            toDateTimeLocalInput(event.occurrences[0]?.sales_start_at ?? null),
        );
        form.setData(
            'sales_end_at',
            toDateTimeLocalInput(event.occurrences[0]?.sales_end_at ?? null),
        );
        form.setData(
            'status',
            (event.occurrences[0]?.status ?? event.status) as EventFormData['status'],
        );
    };
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
        const destination = editingEventId
            ? eventsRoutes.update(editingEventId).url
            : eventsRoutes.store().url;

        form.post(destination, {
            forceFormData: true,
            onSuccess: () => resetEventForm(),
        });
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
                        'Crea funciones y selecciona el plano que define ubicaciones y precios.'
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
                                            role={'button'}
                                            tabIndex={0}
                                            onClick={() => editEvent(item)}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === 'Enter' ||
                                                    event.key === ' '
                                                ) {
                                                    event.preventDefault();
                                                    editEvent(item);
                                                }
                                            }}
                                            className={
                                                'cursor-pointer border-b last:border-0 hover:bg-slate-100 focus:bg-slate-200 focus:outline-none dark:hover:bg-slate-800/60 dark:focus:bg-slate-800'
                                            }
                                        >
                                            <td className={'py-4'}>
                                                <div
                                                    className={
                                                        'flex items-start gap-3'
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted'
                                                        }
                                                    >
                                                        {item.cover_image_url ? (
                                                            <img
                                                                src={
                                                                    item.cover_image_url
                                                                }
                                                                alt={item.name}
                                                                className={
                                                                    'size-full object-cover'
                                                                }
                                                            />
                                                        ) : (
                                                            <span
                                                                className={
                                                                    'text-xs text-muted-foreground'
                                                                }
                                                            >
                                                                Sin foto
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={'min-w-0 flex-1'}>
                                                        <strong>
                                                            {item.name}
                                                        </strong>
                                                        <small
                                                            className={
                                                                'block text-muted-foreground'
                                                            }
                                                        >
                                                            {item.public_code}{' '}
                                                            · {item.category?.name}
                                                        </small>
                                                    </div>
                                                </div>
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
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                        onKeyDown={(event) =>
                                                            event.stopPropagation()
                                                        }
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
                        title={editingEventId ? 'Editar evento' : 'Nuevo evento'}
                        description={
                            editingEventId
                                ? 'Ajusta los datos del evento seleccionado y su portada.'
                                : 'Se creará una función con plano e inventario.'
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
                            {editingEventId && currentCoverUrl ? (
                                <button
                                    type={'button'}
                                    onClick={openCoverPicker}
                                    className={
                                        'group relative block w-full overflow-hidden rounded-xl border border-dashed border-border'
                                    }
                                >
                                    <img
                                        src={currentCoverUrl}
                                        alt={'Portada actual'}
                                        className={
                                            'h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]'
                                        }
                                    />
                                    <div
                                        className={
                                            'absolute inset-0 bg-zinc-950/20 transition group-hover:bg-zinc-950/35'
                                        }
                                    />
                                    <div
                                        className={
                                            'absolute inset-0 flex items-center justify-center'
                                        }
                                    >
                                        <span
                                            className={
                                                'rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-950 shadow-lg'
                                            }
                                        >
                                            Haz clic para cambiar la portada
                                        </span>
                                    </div>
                                </button>
                            ) : (
                                <label
                                    className={
                                        'grid min-h-32 cursor-pointer place-items-center rounded-xl border border-dashed p-4 text-center'
                                    }
                                >
                                    <span>
                                        <Upload
                                            className={
                                                'mx-auto mb-3 text-muted-foreground'
                                            }
                                        />
                                        <strong>
                                            {form.data.cover_image?.name ??
                                                'Subir portada del evento'}
                                        </strong>
                                        <small
                                            className={
                                                'mt-1 block text-muted-foreground'
                                            }
                                        >
                                            Se mostrará como mosaico en el
                                            catálogo público.
                                        </small>
                                    </span>
                                </label>
                            )}
                            <input
                                ref={coverInputRef}
                                type={'file'}
                                accept={'image/*'}
                                className={'hidden'}
                                onChange={(e) =>
                                    form.setData(
                                        'cover_image',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <FieldError message={form.errors.cover_image} />
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
                                                {item.status === 'active'
                                                    ? ''
                                                    : ' (inactivo)'}
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
                            <div className={'grid grid-cols-2 gap-3'}>
                                <div>
                                    <Label>Inicio de ventas</Label>
                                    <Input
                                        type={'datetime-local'}
                                        value={form.data.sales_start_at}
                                        onChange={(e) =>
                                            form.setData(
                                                'sales_start_at',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Fin de ventas</Label>
                                    <Input
                                        type={'datetime-local'}
                                        value={form.data.sales_end_at}
                                        onChange={(e) =>
                                            form.setData(
                                                'sales_end_at',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <p className={'text-xs text-muted-foreground'}>
                                Estas fechas controlan si el evento aparece en venta de entradas.
                            </p>
                            <div>
                                <Label>Estado</Label>
                                <select
                                    className={'h-9 w-full rounded-md border bg-background px-3 text-sm'}
                                    value={form.data.status}
                                    onChange={(e) =>
                                        form.setData('status', e.target.value)
                                    }
                                >
                                    {editingEventId ? (
                                        <>
                                            <option value={'draft'}>
                                                Borrador
                                            </option>
                                            <option value={'published'}>
                                                Publicado
                                            </option>
                                            <option value={'finished'}>
                                                Finalizado
                                            </option>
                                            <option value={'cancelled'}>
                                                Cancelado
                                            </option>
                                        </>
                                    ) : (
                                        <>
                                            <option value={'draft'}>
                                                Borrador
                                            </option>
                                            <option value={'published'}>
                                                Publicado
                                            </option>
                                        </>
                                    )}
                                </select>
                            </div>
                            {Object.values(form.errors).map((error) => (
                                <FieldError
                                    key={error as string}
                                    message={error as string}
                                />
                            ))}
                            <div className={'flex gap-3'}>
                                {editingEventId && (
                                    <Button
                                        type={'button'}
                                        variant={'outline'}
                                        className={'w-full'}
                                        onClick={resetEventForm}
                                        disabled={form.processing}
                                    >
                                        Cancelar edición
                                    </Button>
                                )}
                                <Button
                                    className={'w-full'}
                                    disabled={form.processing}
                                >
                                    <CalendarPlus />
                                    {editingEventId
                                        ? 'Actualizar evento'
                                        : 'Crear evento'}
                                </Button>
                            </div>
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







