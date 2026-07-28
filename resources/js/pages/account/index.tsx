import { Head, Link } from '@inertiajs/react';
import { ArrowRight, PackageCheck, TicketCheck } from 'lucide-react';
import { StateBadge } from '@/components/platform';
import { Button } from '@/components/ui/button';
import { dateTime, money } from '@/lib/platform';

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

export default function Account({
    tickets,
    orders,
}: {
    tickets: CustomerTicket[];
    orders: CustomerOrder[];
}) {
    return (
        <>
            <Head title={'Mi cuenta'} />
            <section className={'border-b border-white/10 bg-zinc-900'}>
                <div className={'mx-auto max-w-7xl px-4 py-14 sm:px-6'}>
                    <span
                        className={
                            'text-sm font-bold tracking-[0.2em] text-brand-light uppercase'
                        }
                    >
                        Portal del cliente
                    </span>
                    <h1 className={'mt-3 text-4xl font-black sm:text-5xl'}>
                        Mis compras
                    </h1>
                    <p className={'mt-3 max-w-2xl text-zinc-400'}>
                        Consulta tus entradas, cupos disponibles y pedidos de
                        productos asociados a tu correo.
                    </p>
                </div>
            </section>
            <div
                className={
                    'mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2'
                }
            >
                <section>
                    <div className={'mb-4 flex items-center gap-3'}>
                        <TicketCheck className={'text-brand-light'} />
                        <h2 className={'text-2xl font-black'}>Entradas</h2>
                    </div>
                    <div className={'space-y-4'}>
                        {tickets.map((ticket) => (
                            <article
                                key={ticket.id}
                                className={
                                    'rounded-2xl border border-white/10 bg-white/5 p-5'
                                }
                            >
                                <div
                                    className={
                                        'flex items-start justify-between gap-4'
                                    }
                                >
                                    <div>
                                        <p className={'text-lg font-bold'}>
                                            {ticket.event_name}
                                        </p>
                                        <p
                                            className={
                                                'mt-1 text-sm text-zinc-400'
                                            }
                                        >
                                            {dateTime(ticket.starts_at)}
                                        </p>
                                    </div>
                                    <StateBadge status={ticket.status} />
                                </div>
                                <div
                                    className={
                                        'mt-4 flex items-end justify-between gap-4'
                                    }
                                >
                                    <div className={'text-sm text-zinc-400'}>
                                        <p
                                            className={
                                                'font-mono text-zinc-200'
                                            }
                                        >
                                            {ticket.public_code}
                                        </p>
                                        <p>
                                            {ticket.quota_total -
                                                ticket.quota_used}{' '}
                                            de {ticket.quota_total} accesos
                                            disponibles
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        size={'sm'}
                                        className={
                                            'bg-brand text-white hover:bg-brand-hover'
                                        }
                                    >
                                        <Link href={ticket.url}>
                                            Ver entrada <ArrowRight />
                                        </Link>
                                    </Button>
                                </div>
                            </article>
                        ))}
                        {tickets.length === 0 && (
                            <p
                                className={
                                    'rounded-2xl border border-dashed border-white/15 p-8 text-center text-zinc-500'
                                }
                            >
                                TodavÃ­a no tienes entradas asociadas.
                            </p>
                        )}
                    </div>
                </section>
                <section>
                    <div className={'mb-4 flex items-center gap-3'}>
                        <PackageCheck className={'text-brand-light'} />
                        <h2 className={'text-2xl font-black'}>Pedidos</h2>
                    </div>
                    <div className={'space-y-4'}>
                        {orders.map((order) => (
                            <article
                                key={order.id}
                                className={
                                    'rounded-2xl border border-white/10 bg-white/5 p-5'
                                }
                            >
                                <div
                                    className={
                                        'flex items-start justify-between gap-4'
                                    }
                                >
                                    <div>
                                        <p className={'font-mono font-bold'}>
                                            {order.order_number}
                                        </p>
                                        <p
                                            className={
                                                'mt-1 text-xs text-zinc-500'
                                            }
                                        >
                                            {dateTime(order.created_at)}
                                        </p>
                                    </div>
                                    <StateBadge status={order.status} />
                                </div>
                                <div
                                    className={'mt-4 divide-y divide-white/10'}
                                >
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={
                                                'flex justify-between gap-4 py-3 text-sm'
                                            }
                                        >
                                            <span>
                                                {item.quantity} Ã—{' '}
                                                {item.product_name_snapshot}
                                                {item.variant_name_snapshot
                                                    ? ` Â· ${item.variant_name_snapshot}`
                                                    : ''}
                                            </span>
                                            <strong>
                                                {money(item.line_total)}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                        {orders.length === 0 && (
                            <p
                                className={
                                    'rounded-2xl border border-dashed border-white/15 p-8 text-center text-zinc-500'
                                }
                            >
                                TodavÃ­a no tienes pedidos asociados.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
