import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    Package,
    Search,
    ShoppingBag,
    Ticket,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader, StateBadge } from '@/components/platform';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInitials } from '@/hooks/use-initials';
import { dateTime, money } from '@/lib/platform';
import { account } from '@/routes';
import eventsRoutes from '@/routes/events';
import store from '@/routes/store';
import type { Auth } from '@/types';

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

type CustomerOrder = {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    items: Array<{
        id: string;
        product_name_snapshot: string;
        variant_name_snapshot: string | null;
        quantity: number;
        line_total: string;
    }>;
};

const orderTotal = (order: CustomerOrder) =>
    order.items.reduce((sum, item) => sum + Number(item.line_total), 0);

const memberSince = (isoDate: string) =>
    new Intl.DateTimeFormat('es-BO', {
        month: 'long',
        year: 'numeric',
    }).format(new Date(isoDate));

const StatCard = ({
    icon,
    value,
    label,
    detail,
}: {
    icon: React.ReactNode;
    value: React.ReactNode;
    label: string;
    detail: string;
}) => (
    <div
        className={
            'group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand/40'
        }
    >
        <div
            aria-hidden
            className={
                'absolute -top-6 -right-6 size-24 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/25'
            }
        />
        <div className={'relative flex items-start justify-between'}>
            <div>
                <p className={'text-sm text-muted-foreground'}>{label}</p>
                <p className={'mt-2 text-2xl font-black'}>{value}</p>
            </div>
            <span
                className={
                    'grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/30'
                }
            >
                {icon}
            </span>
        </div>
        <p className={'relative mt-4 truncate text-xs text-muted-foreground'}>
            {detail}
        </p>
    </div>
);

export default function Account({
    tickets,
    orders,
}: {
    tickets: CustomerTicket[];
    orders: CustomerOrder[];
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [now] = useState(() => Date.now());
    const [search, setSearch] = useState('');
    const getInitials = useInitials();

    const nextTicket = tickets
        .filter((ticket) => new Date(ticket.starts_at).getTime() > now)
        .sort(
            (a, b) =>
                new Date(a.starts_at).getTime() -
                new Date(b.starts_at).getTime(),
        )[0];
    const firstName = auth.user?.name.split(' ')[0];
    const totalSpent = orders
        .filter((order) => order.status === 'paid')
        .reduce((sum, order) => sum + orderTotal(order), 0);

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
    const filteredOrders = useMemo(
        () =>
            query === ''
                ? orders
                : orders.filter(
                      (order) =>
                          order.order_number.toLowerCase().includes(query) ||
                          order.items.some((item) =>
                              item.product_name_snapshot
                                  .toLowerCase()
                                  .includes(query),
                          ),
                  ),
        [orders, query],
    );

    return (
        <>
            <Head title={'Mi cuenta'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Portal del cliente'}
                    title={firstName ? `Hola, ${firstName}` : 'Mi cuenta'}
                    description={
                        'Consulta tus entradas, cupos disponibles y pedidos de productos asociados a tu correo.'
                    }
                />
                {auth.user && (
                    <div
                        className={
                            'relative flex flex-col gap-5 overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between'
                        }
                    >
                        <div className={'flex items-center gap-4'}>
                            <Avatar
                                className={'size-14 border-2 border-brand/30'}
                            >
                                <AvatarImage
                                    src={auth.user.avatar}
                                    alt={auth.user.name}
                                />
                                <AvatarFallback
                                    className={
                                        'bg-gradient-to-br from-brand to-brand-dark text-base font-bold text-white'
                                    }
                                >
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className={'text-lg font-black'}>
                                    {auth.user.name}
                                </p>
                                <p className={'text-sm text-muted-foreground'}>
                                    {auth.user.email}
                                </p>
                                <p
                                    className={
                                        'mt-1 text-xs text-muted-foreground'
                                    }
                                >
                                    Cliente desde{' '}
                                    {memberSince(auth.user.created_at)}
                                </p>
                            </div>
                        </div>
                        <div className={'flex flex-wrap gap-2'}>
                            <Button asChild variant={'outline'}>
                                <Link href={eventsRoutes.index()}>
                                    <CalendarClock className={'size-4'} />
                                    Explorar eventos
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className={
                                    'bg-brand text-white hover:bg-brand-hover'
                                }
                            >
                                <Link href={store.index()}>
                                    <ShoppingBag className={'size-4'} />
                                    Ir a la tienda
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
                <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'}>
                    <StatCard
                        icon={<Ticket className={'size-5'} />}
                        value={tickets.length}
                        label={'Entradas'}
                        detail={'Asociadas a tu correo'}
                    />
                    <StatCard
                        icon={<Package className={'size-5'} />}
                        value={orders.length}
                        label={'Pedidos'}
                        detail={'Compras de productos'}
                    />
                    <StatCard
                        icon={<Wallet className={'size-5'} />}
                        value={money(totalSpent)}
                        label={'Total en compras'}
                        detail={'Pedidos pagados'}
                    />
                    <StatCard
                        icon={<CalendarClock className={'size-5'} />}
                        value={
                            <span className={'text-lg leading-tight'}>
                                {nextTicket
                                    ? dateTime(nextTicket.starts_at)
                                    : 'Ninguna'}
                            </span>
                        }
                        label={'Próxima función'}
                        detail={
                            nextTicket
                                ? nextTicket.event_name
                                : 'No tienes eventos próximos'
                        }
                    />
                </div>
                <div className={'relative max-w-md'}>
                    <Search
                        className={
                            'absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
                        }
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={
                            'Buscar por evento, producto o número de pedido'
                        }
                        className={'pl-9'}
                    />
                </div>
                <div className={'grid gap-6 lg:grid-cols-2'}>
                    <section>
                        <h2 className={'mb-3 text-lg font-black'}>Entradas</h2>
                        <div className={'space-y-4'}>
                            {filteredTickets.map((ticket) => {
                                const remaining =
                                    ticket.quota_total - ticket.quota_used;
                                const usedRatio =
                                    ticket.quota_total > 0
                                        ? Math.min(
                                              100,
                                              (ticket.quota_used /
                                                  ticket.quota_total) *
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
                                                        {dateTime(
                                                            ticket.starts_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <StateBadge
                                                    status={ticket.status}
                                                />
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
                                                    {remaining} de{' '}
                                                    {ticket.quota_total} accesos
                                                    disponibles
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
                                            <Ticket
                                                className={'size-6 text-brand'}
                                            />
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
                            {filteredTickets.length === 0 &&
                                tickets.length > 0 && (
                                    <p
                                        className={
                                            'rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground'
                                        }
                                    >
                                        Ninguna entrada coincide con tu
                                        búsqueda.
                                    </p>
                                )}
                            {tickets.length === 0 && (
                                <div
                                    className={
                                        'rounded-2xl border border-dashed p-8 text-center'
                                    }
                                >
                                    <p
                                        className={
                                            'text-sm text-muted-foreground'
                                        }
                                    >
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
                    </section>
                    <section>
                        <h2 className={'mb-3 text-lg font-black'}>Pedidos</h2>
                        <div className={'space-y-4'}>
                            {filteredOrders.map((order) => (
                                <article
                                    key={order.id}
                                    className={
                                        'group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-2xl hover:shadow-brand/10'
                                    }
                                >
                                    <div
                                        className={
                                            'flex items-start justify-between gap-4 p-5'
                                        }
                                    >
                                        <div
                                            className={
                                                'flex items-center gap-3'
                                            }
                                        >
                                            <span
                                                className={
                                                    'grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/30'
                                                }
                                            >
                                                <Package className={'size-5'} />
                                            </span>
                                            <div>
                                                <p
                                                    className={
                                                        'font-mono font-bold group-hover:text-brand'
                                                    }
                                                >
                                                    {order.order_number}
                                                </p>
                                                <p
                                                    className={
                                                        'mt-1 text-xs text-muted-foreground'
                                                    }
                                                >
                                                    {dateTime(order.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <StateBadge status={order.status} />
                                    </div>
                                    <div className={'divide-y border-t px-5'}>
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className={
                                                    'flex justify-between gap-4 py-3 text-sm'
                                                }
                                            >
                                                <span>
                                                    {item.quantity} ×{' '}
                                                    {item.product_name_snapshot}
                                                    {item.variant_name_snapshot
                                                        ? ` · ${item.variant_name_snapshot}`
                                                        : ''}
                                                </span>
                                                <strong>
                                                    {money(item.line_total)}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                    <div
                                        className={
                                            'flex justify-between bg-muted/40 px-5 py-3 text-sm'
                                        }
                                    >
                                        <span
                                            className={'text-muted-foreground'}
                                        >
                                            Total
                                        </span>
                                        <strong className={'text-brand'}>
                                            {money(orderTotal(order))}
                                        </strong>
                                    </div>
                                </article>
                            ))}
                            {filteredOrders.length === 0 &&
                                orders.length > 0 && (
                                    <p
                                        className={
                                            'rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground'
                                        }
                                    >
                                        Ningún pedido coincide con tu búsqueda.
                                    </p>
                                )}
                            {orders.length === 0 && (
                                <div
                                    className={
                                        'rounded-2xl border border-dashed p-8 text-center'
                                    }
                                >
                                    <p
                                        className={
                                            'text-sm text-muted-foreground'
                                        }
                                    >
                                        Todavía no tienes pedidos asociados.
                                    </p>
                                    <Button
                                        asChild
                                        size={'sm'}
                                        variant={'outline'}
                                        className={'mt-4'}
                                    >
                                        <Link href={store.index()}>
                                            Ir a la tienda
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

Account.layout = {
    breadcrumbs: [{ title: 'Mi cuenta', href: account() }],
};
