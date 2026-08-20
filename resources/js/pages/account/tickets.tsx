import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Search, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader, StateBadge } from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime } from '@/lib/platform';
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
                <div className={'relative max-w-md'}>
                    <Search
                        className={
                            'absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
                        }
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={'Buscar por evento o código'}
                        className={'pl-9'}
                    />
                </div>
                <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
                    {filteredTickets.map((ticket) => {
                        const remaining =
                            ticket.quota_total - ticket.quota_used;
                        const usedRatio =
                            ticket.quota_total > 0
                                ? Math.min(
                                      100,
                                      (ticket.quota_used / ticket.quota_total) *
                                          100,
                                  )
                                : 0;

                        return (
                            <article
                                key={ticket.id}
                                className={
                                    'group flex overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-2xl hover:shadow-brand/10'
                                }
                            >
                                <div className={'min-w-0 flex-1 p-5'}>
                                    <div
                                        className={
                                            'flex items-start justify-between gap-4'
                                        }
                                    >
                                        <div className={'min-w-0'}>
                                            <p
                                                className={
                                                    'truncate text-lg font-bold group-hover:text-brand'
                                                }
                                            >
                                                {ticket.event_name}
                                            </p>
                                            <p
                                                className={
                                                    'mt-1 text-sm text-muted-foreground'
                                                }
                                            >
                                                {dateTime(ticket.starts_at)}
                                            </p>
                                        </div>
                                        <StateBadge status={ticket.status} />
                                    </div>
                                    <p
                                        className={
                                            'mt-3 font-mono text-xs text-muted-foreground'
                                        }
                                    >
                                        {ticket.public_code}
                                    </p>
                                    <div className={'mt-4'}>
                                        <div
                                            className={
                                                'h-1.5 overflow-hidden rounded-full bg-muted'
                                            }
                                        >
                                            <div
                                                className={
                                                    'h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all'
                                                }
                                                style={{
                                                    width: `${usedRatio}%`,
                                                }}
                                            />
                                        </div>
                                        <p
                                            className={
                                                'mt-1.5 text-xs text-muted-foreground'
                                            }
                                        >
                                            {remaining} de {ticket.quota_total}{' '}
                                            accesos disponibles
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={
                                        'relative flex w-28 shrink-0 flex-col items-center justify-center gap-3 border-l border-dashed bg-gradient-to-b from-brand/15 via-brand-dark/5 to-transparent p-4 text-center'
                                    }
                                >
                                    <span
                                        aria-hidden
                                        className={
                                            'absolute -top-3 left-1/2 size-6 -translate-x-1/2 rounded-full bg-background'
                                        }
                                    />
                                    <span
                                        aria-hidden
                                        className={
                                            'absolute -bottom-3 left-1/2 size-6 -translate-x-1/2 rounded-full bg-background'
                                        }
                                    />
                                    <Ticket className={'size-6 text-brand'} />
                                    <Button
                                        asChild
                                        size={'sm'}
                                        className={
                                            'w-full bg-brand text-white hover:bg-brand-hover'
                                        }
                                    >
                                        <Link href={ticket.url}>
                                            <ArrowRight />
                                        </Link>
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                    {filteredTickets.length === 0 && tickets.length > 0 && (
                        <p
                            className={
                                'col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground'
                            }
                        >
                            Ninguna entrada coincide con tu búsqueda.
                        </p>
                    )}
                    {tickets.length === 0 && (
                        <div
                            className={
                                'col-span-full rounded-2xl border border-dashed p-8 text-center'
                            }
                        >
                            <p className={'text-sm text-muted-foreground'}>
                                Todavía no tienes entradas asociadas.
                            </p>
                            <Button
                                asChild
                                size={'sm'}
                                variant={'outline'}
                                className={'mt-4'}
                            >
                                <Link href={eventsRoutes.index()}>
                                    Explorar eventos
                                </Link>
                            </Button>
                        </div>
                    )}
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
