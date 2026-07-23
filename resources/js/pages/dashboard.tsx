import { Head, router } from '@inertiajs/react';
import {
    Banknote,
    Boxes,
    CreditCard,
    ShoppingBag,
    Ticket,
    TicketCheck,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { PageHeader, Panel, StateBadge } from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime, money } from '@/lib/platform';
import { dashboard } from '@/routes';

type Metrics = {
    totalSales: string;
    eventRevenue: string;
    productRevenue: string;
    productProfit: string;
    ticketsSold: number;
    courtesyTickets: number;
    ticketsUsed: number;
    ticketsAvailable: number;
    pendingReservations: number;
    pendingOrders: number;
    lowStockProducts: number;
    paymentIncidents: number;
};
type CashSession = {
    session_number: string;
    opened_at: string;
    opening_amount: string;
    register: { name: string };
} | null;

export default function Dashboard({
    metrics,
    filters,
    cashSession,
}: {
    metrics: Metrics;
    filters: { from: string; to: string };
    cashSession: CashSession;
}) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            dashboard().url,
            { from, to },
            { preserveState: true, replace: true },
        );
    };
    const cards = [
        [
            'Ventas totales',
            money(metrics.totalSales),
            CreditCard,
            'Todas las ventas pagadas',
        ],
        [
            'Ingresos eventos',
            money(metrics.eventRevenue),
            Ticket,
            `${metrics.ticketsSold} accesos vendidos`,
        ],
        [
            'Ingresos productos',
            money(metrics.productRevenue),
            ShoppingBag,
            `${money(metrics.productProfit)} de utilidad`,
        ],
        [
            'Uso de entradas',
            String(metrics.ticketsUsed),
            TicketCheck,
            `${metrics.ticketsAvailable} cupos disponibles · ${metrics.courtesyTickets} cortesías`,
        ],
    ] as const;

    return (
        <>
            <Head title={'Dashboard'} />
            <div
                className={
                    'flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 sm:p-6'
                }
            >
                <PageHeader
                    eyebrow={'Operación'}
                    title={'Dashboard'}
                    description={
                        'Indicadores consolidados de ventas, inventario, entradas y caja.'
                    }
                    action={
                        <form onSubmit={apply} className={'flex gap-2'}>
                            <Input
                                type={'date'}
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                            <Input
                                type={'date'}
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                            <Button>Aplicar</Button>
                        </form>
                    }
                />
                <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'}>
                    {cards.map(([title, value, Icon, detail]) => (
                        <Panel key={title}>
                            <div className={'flex items-start justify-between'}>
                                <div>
                                    <p
                                        className={
                                            'text-sm text-muted-foreground'
                                        }
                                    >
                                        {title}
                                    </p>
                                    <p className={'mt-2 text-3xl font-black'}>
                                        {value}
                                    </p>
                                </div>
                                <span
                                    className={
                                        'rounded-xl bg-primary/10 p-3 text-primary'
                                    }
                                >
                                    <Icon />
                                </span>
                            </div>
                            <p className={'mt-4 text-xs text-muted-foreground'}>
                                {detail}
                            </p>
                        </Panel>
                    ))}
                </div>
                <div className={'grid gap-4 lg:grid-cols-3'}>
                    <Panel
                        title={'Alertas operativas'}
                        className={'lg:col-span-2'}
                    >
                        <div className={'grid gap-3 sm:grid-cols-3'}>
                            <div className={'rounded-lg border p-4'}>
                                <Boxes className={'text-amber-500'} />
                                <strong className={'mt-3 block text-2xl'}>
                                    {metrics.lowStockProducts}
                                </strong>
                                <span
                                    className={'text-sm text-muted-foreground'}
                                >
                                    alertas de stock
                                </span>
                            </div>
                            <div className={'rounded-lg border p-4'}>
                                <CreditCard className={'text-red-500'} />
                                <strong className={'mt-3 block text-2xl'}>
                                    {metrics.paymentIncidents}
                                </strong>
                                <span
                                    className={'text-sm text-muted-foreground'}
                                >
                                    pagos por revisar
                                </span>
                            </div>
                            <div className={'rounded-lg border p-4'}>
                                <Ticket className={'text-blue-500'} />
                                <strong className={'mt-3 block text-2xl'}>
                                    {metrics.pendingReservations}
                                </strong>
                                <span
                                    className={'text-sm text-muted-foreground'}
                                >
                                    reservas activas
                                </span>
                            </div>
                        </div>
                    </Panel>
                    <Panel title={'Caja actual'}>
                        {cashSession ? (
                            <div>
                                <StateBadge status={'open'} />
                                <p className={'mt-4 text-2xl font-black'}>
                                    {cashSession.register.name}
                                </p>
                                <p
                                    className={
                                        'mt-1 text-sm text-muted-foreground'
                                    }
                                >
                                    {cashSession.session_number}
                                </p>
                                <p className={'mt-4 flex gap-2 text-sm'}>
                                    <Banknote className={'size-4'} />
                                    Apertura {money(cashSession.opening_amount)}
                                </p>
                                <p
                                    className={
                                        'mt-2 text-xs text-muted-foreground'
                                    }
                                >
                                    {dateTime(cashSession.opened_at)}
                                </p>
                            </div>
                        ) : (
                            <p className={'text-sm text-muted-foreground'}>
                                No existe una sesión de caja abierta.
                            </p>
                        )}
                    </Panel>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = { breadcrumbs: [{ title: 'Dashboard', href: dashboard() }] };
