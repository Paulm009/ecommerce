import { Head, router } from '@inertiajs/react';
import { CheckCheck, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    PageHeader,
    Pagination,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime, money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import ordersRoutes from '@/routes/admin/orders';

type Order = {
    id: string;
    order_number: string;
    buyer_name: string;
    buyer_email: string;
    status: string;
    created_at: string;
    sale: { total_amount: string; currency_code: string; status: string };
    items: {
        id: string;
        product_name_snapshot: string;
        variant_name_snapshot: string | null;
        quantity: number;
        line_total: string;
    }[];
};

export default function Orders({
    orders,
    filters,
}: {
    orders: Paginated<Order>;
    filters: { search: string; status: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const filter = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            ordersRoutes.index().url,
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title={'Pedidos'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Fulfillment'}
                    title={'Pedidos de productos'}
                    description={
                        'Consulta pagos y confirma la entrega física de cada pedido.'
                    }
                />
                <Panel>
                    <form
                        onSubmit={filter}
                        className={'mb-5 flex flex-col gap-2 sm:flex-row'}
                    >
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={'Número, cliente, correo o teléfono'}
                        />
                        <select
                            className={
                                'h-9 rounded-md border bg-background px-3 text-sm'
                            }
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value={''}>Todos</option>
                            <option value={'pending_payment'}>
                                Pendientes
                            </option>
                            <option value={'paid'}>Pagados</option>
                            <option value={'delivered'}>Entregados</option>
                            <option value={'cancelled'}>Cancelados</option>
                        </select>
                        <Button>
                            <Search />
                            Filtrar
                        </Button>
                    </form>
                    <div className={'space-y-3'}>
                        {orders.data.map((order) => (
                            <article
                                key={order.id}
                                className={'rounded-lg border p-4'}
                            >
                                <div
                                    className={
                                        'flex flex-wrap justify-between gap-4'
                                    }
                                >
                                    <div>
                                        <strong>{order.order_number}</strong>
                                        <p
                                            className={
                                                'text-sm text-muted-foreground'
                                            }
                                        >
                                            {order.buyer_name} ·{' '}
                                            {order.buyer_email}
                                        </p>
                                        <p
                                            className={
                                                'mt-1 text-xs text-muted-foreground'
                                            }
                                        >
                                            {dateTime(order.created_at)}
                                        </p>
                                    </div>
                                    <div className={'text-right'}>
                                        <StateBadge status={order.status} />
                                        <p className={'mt-2 font-black'}>
                                            {money(
                                                order.sale.total_amount,
                                                order.sale.currency_code,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={
                                        'mt-4 flex flex-wrap items-end justify-between gap-3 border-t pt-4'
                                    }
                                >
                                    <div className={'text-sm'}>
                                        {order.items.map((item) => (
                                            <p key={item.id}>
                                                {item.quantity} ×{' '}
                                                {item.product_name_snapshot}{' '}
                                                {item.variant_name_snapshot}
                                            </p>
                                        ))}
                                    </div>
                                    {order.status === 'paid' && (
                                        <Button
                                            size={'sm'}
                                            onClick={() =>
                                                router.patch(
                                                    ordersRoutes.deliver(
                                                        order.id,
                                                    ).url,
                                                )
                                            }
                                        >
                                            <CheckCheck />
                                            Marcar entregado
                                        </Button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                    <Pagination page={orders} />
                </Panel>
            </div>
        </>
    );
}

Orders.layout = {
    breadcrumbs: [{ title: 'Pedidos', href: ordersRoutes.index() }],
};
