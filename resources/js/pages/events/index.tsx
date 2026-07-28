import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import eventsRoutes from '@/routes/events';

type EventItem = {
    id: string;
    name: string;
    slug: string;
    short_description: string | null;
    venue_name: string;
    city: string | null;
    cover_image_url: string | null;
    category: { name: string } | null;
    occurrences: { starts_at: string }[];
};

export default function EventIndex({
    events,
    categories,
    filters,
}: {
    events: Paginated<EventItem>;
    categories: { id: string; name: string; slug: string }[];
    filters: { search: string; category: string; city: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [category, setCategory] = useState(filters.category);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            eventsRoutes.index().url,
            { search, category },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title={'Eventos'} />
            <section
                className={
                    'border-b border-white/10 bg-gradient-to-b from-amber-400/10 to-transparent'
                }
            >
                <div className={'mx-auto max-w-7xl px-4 py-16 sm:px-6'}>
                    <p
                        className={
                            'text-sm font-bold tracking-[.25em] text-amber-400 uppercase'
                        }
                    >
                        Agenda
                    </p>
                    <h1 className={'mt-3 text-4xl font-black sm:text-6xl'}>
                        Encuentra tu próximo evento.
                    </h1>
                    <form
                        onSubmit={submit}
                        className={
                            'mt-8 flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row'
                        }
                    >
                        <div className={'relative flex-1'}>
                            <Search
                                className={
                                    'absolute top-3 left-3 size-4 text-zinc-500'
                                }
                            />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={'Buscar por nombre'}
                                className={'border-white/10 bg-zinc-900 pl-9'}
                            />
                        </div>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={
                                'h-9 rounded-md border border-white/10 bg-zinc-900 px-3 text-sm'
                            }
                        >
                            <option value={''}>Todas las categorías</option>
                            {categories.map((item) => (
                                <option key={item.id} value={item.slug}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <Button
                            className={
                                'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                            }
                        >
                            Buscar
                        </Button>
                    </form>
                </div>
            </section>
            <section className={'mx-auto max-w-7xl px-4 py-12 sm:px-6'}>
                <div className={'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
                    {events.data.map((event, index) => (
                        <Link
                            key={event.id}
                            href={eventsRoutes.show(event.slug)}
                            className={
                                'group overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] transition hover:-translate-y-1 hover:border-amber-300/40'
                            }
                        >
                            <div className={'relative aspect-[16/10] overflow-hidden bg-zinc-900'}>
                                {event.cover_image_url ? (
                                    <img
                                        src={event.cover_image_url}
                                        alt={event.name}
                                        className={
                                            'absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105'
                                        }
                                    />
                                ) : (
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${['from-fuchsia-600 to-orange-400', 'from-cyan-500 to-blue-700', 'from-emerald-500 to-lime-400'][index % 3]}`}
                                    />
                                )}
                                <div
                                    className={
                                        'absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent'
                                    }
                                />
                                <span
                                    className={
                                        'absolute top-4 left-4 rounded-full bg-black/45 px-3 py-1 text-xs font-bold backdrop-blur'
                                    }
                                >
                                    {event.category?.name ?? 'Experiencia'}
                                </span>
                                {!event.cover_image_url && (
                                    <CalendarDays
                                        className={
                                            'absolute right-4 bottom-4 size-9'
                                        }
                                    />
                                )}
                            </div>
                            <div className={'p-6'}>
                                <p
                                    className={
                                        'text-sm font-semibold text-amber-300'
                                    }
                                >
                                    {event.occurrences[0]
                                        ? dateTime(
                                              event.occurrences[0].starts_at,
                                          )
                                        : 'Próximamente'}
                                </p>
                                <h2
                                    className={
                                        'mt-2 text-2xl font-black group-hover:text-amber-300'
                                    }
                                >
                                    {event.name}
                                </h2>
                                <p
                                    className={
                                        'mt-3 line-clamp-2 text-sm leading-6 text-zinc-400'
                                    }
                                >
                                    {event.short_description}
                                </p>
                                <p
                                    className={
                                        'mt-5 flex items-center gap-2 text-sm text-zinc-300'
                                    }
                                >
                                    <MapPin className={'size-4'} />
                                    {event.venue_name}
                                    {event.city ? ` · ${event.city}` : ''}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
                {events.data.length === 0 && (
                    <p
                        className={
                            'rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-400'
                        }
                    >
                        No encontramos eventos con esos filtros.
                    </p>
                )}
                <div className={'mt-10 flex justify-center gap-3'}>
                    {events.prev_page_url && (
                        <Button asChild variant={'outline'}>
                            <Link href={events.prev_page_url}>Anterior</Link>
                        </Button>
                    )}
                    {events.next_page_url && (
                        <Button asChild variant={'outline'}>
                            <Link href={events.next_page_url}>Siguiente</Link>
                        </Button>
                    )}
                </div>
            </section>
        </>
    );
}
