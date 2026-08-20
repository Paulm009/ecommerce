import { Head, Link } from '@inertiajs/react';
import { Package, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader, StateBadge } from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime, money } from '@/lib/platform';
import { account } from '@/routes';
import { orders as accountOrders } from '@/routes/account';
import store from '@/routes/store';

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

export default function AccountOrders({ orders }: { orders: CustomerOrder[] }) {
    const [search, setSearch] = useState('');
    const query = search.trim().toLowerCase();
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
            <Head title={'Mis pedidos'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Portal del cliente'}
                    title={'Mis pedidos'}
                    description={
                        'Todos tus pedidos de productos, con su estado y detalle de compra.'
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
                        placeholder={'Buscar por producto o número de pedido'}
                        className={'pl-9'}
                    />
                </div>
                <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
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
                                <div className={'flex items-center gap-3'}>
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
                                <span className={'text-muted-foreground'}>
                                    Total
                                </span>
                                <strong className={'text-brand'}>
                                    {money(orderTotal(order))}
                                </strong>
                            </div>
                        </article>
                    ))}
                    {filteredOrders.length === 0 && orders.length > 0 && (
                        <p
                            className={
                                'col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground'
                            }
                        >
                            Ningún pedido coincide con tu búsqueda.
                        </p>
                    )}
                    {orders.length === 0 && (
                        <div
                            className={
                                'col-span-full rounded-2xl border border-dashed p-8 text-center'
                            }
                        >
                            <p className={'text-sm text-muted-foreground'}>
                                Todavía no tienes pedidos asociados.
                            </p>
                            <Button
                                asChild
                                size={'sm'}
                                variant={'outline'}
                                className={'mt-4'}
                            >
                                <Link href={store.index()}>Ir a la tienda</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AccountOrders.layout = {
    breadcrumbs: [
        { title: 'Mi perfil', href: account() },
        { title: 'Mis pedidos', href: accountOrders() },
    ],
};
