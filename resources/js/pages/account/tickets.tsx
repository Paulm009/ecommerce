import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Clock, QrCode, Search, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    ClientPagination,
    useMobilePagination,
} from '@/components/client-pagination';
import { PageHeader, StateBadge } from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { account } from '@/routes';
import { tickets as accountTickets } from '@/routes/account';
import eventsRoutes from '@/routes/events';

type CustomerTicket = {
    id: string;
    public_code: string;
    status: string;
    quota_total: number;
    quota_used: number;
    issued_at: string;
    event_name: string;
    starts_at: string;
    url: string;
};

const datePart = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-BO', options).format(new Date(iso));

export default function AccountTickets({
    tickets,
}: {
    tickets: CustomerTicket[];
}) {
    const [search, setSearch] = useState('');
    const query = search.trim().toLowerCase();
    const filteredTickets = useMemo(
        () =>
            query === ''
                ? tickets
                : tickets.filter(
                      (ticket) =>
                          ticket.event_name.toLowerCase().includes(query) ||
                          ticket.public_code.toLowerCase().includes(query),
                  ),
        [tickets, query],
    );
    const {
        visibleItems: visibleTickets,
        currentPage,
        pageCount,
        goToPage,
        setPage,
    } = useMobilePagination(filteredTickets);

    return (
        <>
            <Head title={'Mis entradas'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Portal del cliente'}
                    title={'Mis entradas'}
                    description={
                        'Todas las entradas asociadas a tu correo, con su cupo de acceso disponible.'
                    }
                />
                <div className={'flex flex-wrap items-center gap-3'}>
                    <div className={'relative w-full max-w-md'}>
                        <Search
                            className={
                                'absolute top-1/2 left-4 size-5 -translate-y-1/2 text-brand'
                            }
                        />
                        <Input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder={'Buscar por evento o código'}
                            className={
                                'h-12 rounded-2xl border-foreground/10 bg-card pl-12 text-base focus-visible:border-brand focus-visible:ring-brand/30'
                            }
                        />
                    </div>
                    <span
                        className={
                            'rounded-full border border-brand/40 bg-brand/15 px-4 py-2 text-xs font-bold tracking-[0.2em] text-brand-light uppercase'
                        }
                    >
                        {filteredTickets.length}{' '}
                        {filteredTickets.length === 1 ? 'entrada' : 'entradas'}
                    </span>
                </div>
                <div
                    className={
                        '-mx-2 scrollbar-brand px-2 pt-2 pb-4 md:max-h-[calc(100svh-21rem)] md:overflow-y-auto'
                    }
                >
                    <div className={'grid gap-5 lg:grid-cols-2'}>
                        {visibleTickets.map((ticket) => {
                            const remaining =
                                ticket.quota_total - ticket.quota_used;
                            const remainingRatio =
                                ticket.quota_total > 0
                                    ? Math.min(
                                          100,
                                          (remaining / ticket.quota_total) *
                                              100,
                                      )
                                    : 0;

                            return (
                                <article
                                    key={ticket.id}
                                    className={
                                        'group relative flex min-h-56 overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-brand/15 via-card to-card shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1.5 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/25'
                                    }
                                >
                                    <div
                                        aria-hidden
                                        className={
                                            'absolute -top-16 -left-16 size-48 rounded-full bg-brand/20 blur-3xl transition duration-500 group-hover:bg-brand/35'
                                        }
                                    />
                                    <div
                                        className={
                                            'relative flex min-w-0 flex-1 gap-5 p-5 sm:p-6'
                                        }
                                    >
                                        <div
                                            className={
                                                'hidden w-20 shrink-0 flex-col items-center justify-center self-start rounded-2xl border border-brand/40 bg-foreground/5 py-3 sm:flex'
                                            }
                                        >
                                            <span
                                                className={
                                                    'text-[11px] font-bold tracking-[0.2em] text-brand-light uppercase'
                                                }
                                            >
                                                {datePart(ticket.starts_at, {
                                                    month: 'short',
                                                }).replace('.', '')}
                                            </span>
                                            <span
                                                className={
                                                    'font-display text-5xl leading-none text-foreground'
                                                }
                                            >
                                                {datePart(ticket.starts_at, {
                                                    day: 'numeric',
                                                })}
                                            </span>
                                            <span
                                                className={
                                                    'mt-1 text-[11px] text-muted-foreground'
                                                }
                                            >
                                                {datePart(ticket.starts_at, {
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                'flex min-w-0 flex-1 flex-col'
                                            }
                                        >
                                            <div
                                                className={
                                                    'flex flex-col-reverse items-start gap-2 sm:flex-row sm:justify-between sm:gap-3'
                                                }
                                            >
                                                <p
                                                    className={
                                                        'line-clamp-2 font-display text-2xl leading-none tracking-wide text-foreground uppercase transition group-hover:text-brand-light sm:truncate sm:text-3xl'
                                                    }
                                                >
                                                    {ticket.event_name}
                                                </p>
                                                <StateBadge
                                                    status={ticket.status}
                                                />
                                            </div>
                                            <p
                                                className={
                                                    'mt-2 flex items-center gap-1.5 text-sm text-muted-foreground'
                                                }
                                            >
                                                <Clock
                                                    className={
                                                        'size-4 text-brand'
                                                    }
                                                />
                                                {datePart(ticket.starts_at, {
                                                    dateStyle: 'full',
                                                    timeStyle: 'short',
                                                })}
                                            </p>
                                            <span
                                                className={
                                                    'mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-foreground/10 bg-foreground/5 px-2.5 py-1 font-mono text-[11px] tracking-wider whitespace-nowrap text-foreground/80 sm:text-xs'
                                                }
                                            >
                                                <QrCode
                                                    className={
                                                        'size-3.5 text-brand-light'
                                                    }
                                                />
                                                {ticket.public_code}
                                            </span>
                                            <div className={'mt-auto pt-5'}>
                                                <div
                                                    className={
                                                        'mb-2 flex items-end justify-between gap-2'
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            'text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase sm:text-xs'
                                                        }
                                                    >
                                                        Accesos disponibles
                                                    </span>
                                                    <span
                                                        className={
                                                            'font-display text-2xl leading-none whitespace-nowrap text-foreground'
                                                        }
                                                    >
                                                        {remaining}
                                                        <span
                                                            className={
                                                                'text-base text-muted-foreground'
                                                            }
                                                        >
                                                            {' '}
                                                            /{' '}
                                                            {ticket.quota_total}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div
                                                    className={
                                                        'h-2.5 overflow-hidden rounded-full bg-foreground/10'
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            'h-full rounded-full bg-gradient-to-r from-brand-dark via-brand to-brand-light shadow-[0_0_12px] shadow-brand/60 transition-all'
                                                        }
                                                        style={{
                                                            width: `${remainingRatio}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href={ticket.url}
                                        className={
                                            'relative flex w-28 shrink-0 flex-col items-center justify-center gap-3 border-l-2 border-dashed border-white/20 bg-gradient-to-b from-brand-light via-brand to-brand-dark p-4 text-center text-white transition duration-300 group-hover:brightness-110 focus-visible:ring-4 focus-visible:ring-brand/50 focus-visible:outline-none max-sm:w-24 max-sm:p-3 sm:w-32'
                                        }
                                    >
                                        <span
                                            aria-hidden
                                            className={
                                                'absolute -top-4 -left-4 size-8 rounded-full bg-background'
                                            }
                                        />
                                        <span
                                            aria-hidden
                                            className={
                                                'absolute -bottom-4 -left-4 size-8 rounded-full bg-background'
                                            }
                                        />
                                        <Ticket
                                            className={
                                                'size-8 transition duration-300 group-hover:scale-110 group-hover:-rotate-12 sm:size-10'
                                            }
                                        />
                                        <span
                                            className={
                                                'font-display text-lg leading-none tracking-wide uppercase sm:text-xl'
                                            }
                                        >
                                            Ver entrada
                                        </span>
                                        <ArrowUpRight
                                            className={
                                                'size-6 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1'
                                            }
                                        />
                                    </Link>
                                </article>
                            );
                        })}
                        {filteredTickets.length === 0 && tickets.length > 0 && (
                            <p
                                className={
                                    'col-span-full rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground'
                                }
                            >
                                Ninguna entrada coincide con tu búsqueda.
                            </p>
                        )}
                        {tickets.length === 0 && (
                            <div
                                className={
                                    'col-span-full rounded-3xl border border-dashed p-10 text-center'
                                }
                            >
                                <p className={'text-sm text-muted-foreground'}>
                                    Todavía no tienes entradas asociadas.
                                </p>
                                <Button
                                    asChild
                                    className={
                                        'mt-4 bg-brand text-white hover:bg-brand-hover'
                                    }
                                >
                                    <Link href={eventsRoutes.index()}>
                                        Explorar eventos
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                    <ClientPagination
                        page={currentPage}
                        pageCount={pageCount}
                        onChange={goToPage}
                        label={'Paginación de entradas'}
                    />
                </div>
            </div>
        </>
    );
}

AccountTickets.layout = {
    breadcrumbs: [
        { title: 'Mi perfil', href: account() },
        { title: 'Mis entradas', href: accountTickets() },
    ],
};
