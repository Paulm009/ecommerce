import { Head, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    MapPin,
    Minus,
    Plus,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime, money, sessionToken } from '@/lib/platform';
import reservations from '@/routes/reservations';

type Inventory = { available_quantity: number };
type TicketType = {
    id: string;
    name: string;
    base_price: string;
    pivot?: {
        price_override: string | null;
    };
};
type LocationMetadata = {
    price?: string;
};
type Location = {
    id: string;
    label: string;
    location_type: string;
    capacity: number;
    inventory: Inventory | null;
    metadata_json: LocationMetadata | null;
    ticketTypes: TicketType[];
};
type Occurrence = {
    id: string;
    starts_at: string;
    sales_end_at: string | null;
    layout: { locations: Location[] };
};
type Event = {
    name: string;
    short_description: string | null;
    description: string | null;
    venue_name: string;
    venue_address: string | null;
    city: string | null;
    cover_image_url: string | null;
    category: { name: string } | null;
    occurrences: Occurrence[];
};

export default function EventShow({ event }: { event: Event }) {
    const occurrence = event.occurrences[0];
    const form = useForm({
        session_token: sessionToken(),
        items: [
            {
                event_location_id: occurrence?.layout.locations[0]?.id ?? '',
                quantity: 1,
            },
        ],
    });
    const selectedLocation = occurrence?.layout.locations.find(
        (item) => item.id === form.data.items[0].event_location_id,
    );
    const selectedTicketType = selectedLocation?.ticketTypes?.[0];
    const selectedTicketPrice = selectedTicketType
        ? (selectedTicketType.pivot?.price_override ??
          selectedTicketType.base_price ??
          selectedLocation?.metadata_json?.price ??
          '0.00')
        : (selectedLocation?.metadata_json?.price ?? '0.00');
    const quantity = form.data.items[0].quantity;
    const setItem = (changes: Partial<(typeof form.data.items)[0]>) =>
        form.setData('items', [{ ...form.data.items[0], ...changes }]);

    if (!occurrence) {
        return (
            <div className={'mx-auto max-w-4xl px-4 py-24 text-center'}>
                Este evento no tiene funciones disponibles.
            </div>
        );
    }

    return (
        <>
            <Head title={event.name} />
            <section
                className={
                    'relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-fuchsia-700/35 via-zinc-950 to-brand/20 text-white'
                }
            >
                {event.cover_image_url && (
                    <img
                        src={event.cover_image_url}
                        alt={event.name}
                        className={
                            'absolute inset-0 h-full w-full object-cover opacity-35'
                        }
                    />
                )}
                <div className={'absolute inset-0 bg-zinc-950/45'} />
                <div className={'mx-auto max-w-7xl px-4 py-16 sm:px-6'}>
                    <span
                        className={
                            'rounded-full border border-white/25 bg-white/20 px-3 py-1 text-sm font-semibold text-white shadow-lg shadow-black/20'
                        }
                    >
                        {event.category?.name ?? 'Evento'}
                    </span>
                    <h1
                        className={
                            'mt-6 max-w-4xl text-5xl font-black tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.65)] sm:text-7xl'
                        }
                    >
                        {event.name}
                    </h1>
                    <p
                        className={
                            'mt-6 max-w-2xl text-lg leading-8 text-zinc-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]'
                        }
                    >
                        {event.short_description}
                    </p>
                    <div
                        className={
                            'mt-8 flex flex-wrap gap-6 text-sm font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]'
                        }
                    >
                        <span className={'flex gap-2'}>
                            <CalendarDays
                                className={
                                    'size-5 text-brand-light drop-shadow-sm'
                                }
                            />
                            {dateTime(occurrence.starts_at)}
                        </span>
                        <span className={'flex gap-2'}>
                            <MapPin
                                className={
                                    'size-5 text-brand-light drop-shadow-sm'
                                }
                            />
                            {event.venue_name}
                            {event.city ? `, ${event.city}` : ''}
                        </span>
                    </div>
                </div>
            </section>
            <section
                className={
                    'mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px]'
                }
            >
                <div>
                    <h2 className={'text-2xl font-black'}>
                        Elige tu ubicación
                    </h2>
                    <p className={'mt-2 text-zinc-400'}>
                        La disponibilidad se bloquea durante 5 minutos al
                        continuar.
                    </p>
                    <div className={'mt-6 grid gap-3 sm:grid-cols-2'}>
                        {occurrence.layout.locations.map((location) => {
                            const selected =
                                form.data.items[0].event_location_id ===
                                location.id;
                            const locationTicketType =
                                location.ticketTypes?.[0];
                            const locationTicketPrice = locationTicketType
                                ? (locationTicketType.pivot?.price_override ??
                                  locationTicketType.base_price ??
                                  location.metadata_json?.price ??
                                  null)
                                : (location.metadata_json?.price ?? null);

                            return (
                                <button
                                    type={'button'}
                                    key={location.id}
                                    disabled={
                                        (location.inventory
                                            ?.available_quantity ?? 0) < 1
                                    }
                                    onClick={() =>
                                        setItem({
                                            event_location_id: location.id,
                                        })
                                    }
                                    className={`rounded-xl border p-5 text-left transition ${selected ? 'border-brand bg-brand/10' : 'border-white/10 bg-white/[.03] hover:border-white/25'} disabled:opacity-40`}
                                >
                                    <div
                                        className={'flex justify-between gap-3'}
                                    >
                                        <strong>{location.label}</strong>
                                        <span
                                            className={'text-xs text-zinc-400'}
                                        >
                                            {location.inventory
                                                ?.available_quantity ?? 0}{' '}
                                            disp.
                                        </span>
                                    </div>
                                    <p
                                        className={
                                            'mt-2 text-sm text-zinc-400 capitalize'
                                        }
                                    >
                                        {location.location_type} · capacidad{' '}
                                        {location.capacity}
                                    </p>
                                    <p
                                        className={
                                            'mt-3 text-sm font-semibold text-brand-light'
                                        }
                                    >
                                        {locationTicketPrice
                                            ? money(locationTicketPrice)
                                            : 'Sin precio asignado'}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                    {event.description && (
                        <p
                            className={
                                'mt-10 leading-8 whitespace-pre-line text-zinc-400'
                            }
                        >
                            {event.description}
                        </p>
                    )}
                </div>
                <aside
                    className={
                        'h-fit rounded-2xl border border-white/10 bg-white/[.04] p-6 lg:sticky lg:top-24'
                    }
                >
                    <p
                        className={
                            'text-sm font-bold tracking-wider text-zinc-500 uppercase'
                        }
                    >
                        Tu selección
                    </p>
                    <h3 className={'mt-4 text-xl font-black'}>
                        {selectedLocation?.label ?? 'Ubicación'}
                    </h3>
                    <p className={'mt-1 text-zinc-400'}>
                        {selectedTicketType
                            ? `${money(selectedTicketPrice)} por unidad`
                            : 'Selecciona una ubicación'}
                    </p>
                    <div
                        className={
                            'mt-6 flex items-center justify-between border-y border-white/10 py-4'
                        }
                    >
                        <span>Cantidad</span>
                        <div className={'flex items-center gap-3'}>
                            <Button
                                type={'button'}
                                size={'icon'}
                                variant={'outline'}
                                onClick={() =>
                                    setItem({
                                        quantity: Math.max(1, quantity - 1),
                                    })
                                }
                                className={
                                    'border-white/20 bg-white/10 text-white shadow-sm hover:border-white/30 hover:bg-white/20 hover:text-white'
                                }
                            >
                                <Minus className={'size-4'} />
                            </Button>
                            <Input
                                value={quantity}
                                readOnly
                                className={
                                    'w-12 border-0 bg-transparent p-0 text-center'
                                }
                            />
                            <Button
                                type={'button'}
                                size={'icon'}
                                variant={'outline'}
                                onClick={() =>
                                    setItem({
                                        quantity: Math.min(20, quantity + 1),
                                    })
                                }
                                className={
                                    'border-white/20 bg-white/10 text-white shadow-sm hover:border-white/30 hover:bg-white/20 hover:text-white'
                                }
                            >
                                <Plus className={'size-4'} />
                            </Button>
                        </div>
                    </div>
                    <div className={'flex justify-between py-6 text-lg'}>
                        <span>Total</span>
                        <strong>
                            {money(Number(selectedTicketPrice) * quantity)}
                        </strong>
                    </div>
                    <Button
                        className={
                            'w-full bg-brand text-white hover:bg-brand-hover'
                        }
                        disabled={form.processing || !selectedLocation}
                        onClick={() =>
                            form.post(reservations.store(occurrence.id).url)
                        }
                    >
                        Reservar entradas
                    </Button>
                    <p
                        className={
                            'mt-4 flex gap-2 text-xs leading-5 text-zinc-500'
                        }
                    >
                        <ShieldCheck className={'size-4 shrink-0'} />
                        Inventario protegido con bloqueo transaccional.
                    </p>
                    <p
                        className={
                            'mt-2 flex gap-2 text-xs leading-5 text-zinc-500'
                        }
                    >
                        <Clock3 className={'size-4 shrink-0'} />
                        Completa tus datos antes de que venza la reserva.
                    </p>
                    {Object.values(form.errors).map((error) => (
                        <p key={error} className={'mt-2 text-sm text-red-400'}>
                            {error}
                        </p>
                    ))}
                </aside>
            </section>
        </>
    );
}
