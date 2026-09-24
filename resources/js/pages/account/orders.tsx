import { Head, Link } from '@inertiajs/react';
import { Package, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    ClientPagination,
    useMobilePagination,
} from '@/components/client-pagination';
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
    const {
        visibleItems: visibleOrders,
        currentPage,
        pageCount,
        goToPage,
        setPage,
    } = useMobilePagination(filteredOrders);

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
                            placeholder={
                                'Buscar por producto o número de pedido'
                            }
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
                        {filteredOrders.length}{' '}
                        {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                </div>
                <div
                    className={
                        '-mx-2 scrollbar-brand px-2 pt-2 pb-4 md:max-h-[calc(100svh-21rem)] md:overflow-y-auto'
                    }
                >
                    <div className={'grid gap-5 sm:grid-cols-2 xl:grid-cols-3'}>
                        {visibleOrders.map((order) => (
                            <article
                                key={order.id}
                                className={
                                    'group relative flex min-h-72 flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-brand/15 via-card to-card shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1.5 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/25'
                                }
                            >
                                <div
                                    aria-hidden
                                    className={
                                        'absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-dark via-brand to-brand-light opacity-70 transition group-hover:opacity-100'
                                    }
                                />
                                <div
                                    aria-hidden
                                    className={
                                        'absolute -top-12 -right-12 size-44 rounded-full bg-brand/20 blur-3xl transition duration-500 group-hover:bg-brand/40'
                                    }
                                />
                                <Package
                                    aria-hidden
                                    strokeWidth={1.25}
                                    className={
                                        'absolute -right-8 bottom-10 size-40 rotate-12 text-brand/10 transition duration-500 group-hover:rotate-0 group-hover:text-brand/20'
                                    }
                                />
                                <div
                                    className={
                                        'relative flex flex-col-reverse items-start gap-3 p-6 pb-4 sm:flex-row sm:justify-between'
                                    }
                                >
                                    <div
                                        className={
                                            'flex min-w-0 items-center gap-4'
                                        }
                                    >
                                        <span
                                            className={
                                                'grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white shadow-lg ring-1 shadow-brand/40 ring-white/20 transition duration-300 group-hover:scale-110 group-hover:rotate-6'
                                            }
                                        >
                                            <Package className={'size-7'} />
                                        </span>
                                        <div className={'min-w-0'}>
                                            <p
                                                className={
                                                    'truncate font-display text-2xl leading-none tracking-wide text-foreground transition group-hover:text-brand-light'
                                                }
                                            >
                                                {order.order_number}
                                            </p>
                                            <p
                                                className={
                                                    'mt-2 text-xs text-muted-foreground'
                                                }
                                            >
                                                {dateTime(order.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <StateBadge status={order.status} />
                                </div>
                                <div
                                    className={
                                        'relative mx-6 max-h-40 scrollbar-brand space-y-2 overflow-y-auto pr-1'
                                    }
                                >
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={
                                                'flex items-center justify-between gap-3 rounded-xl border border-foreground/5 bg-foreground/5 px-3 py-2.5 text-sm backdrop-blur'
                                            }
                                        >
                                            <span
                                                className={
                                                    'flex min-w-0 items-center gap-2.5'
                                                }
                                            >
                                                <span
                                                    className={
                                                        'grid h-7 min-w-7 shrink-0 place-items-center rounded-lg bg-brand/20 px-1.5 text-xs font-bold text-brand-light'
                                                    }
                                                >
                                                    ×{item.quantity}
                                                </span>
                                                <span className={'truncate'}>
                                                    {item.product_name_snapshot}
                                                    {item.variant_name_snapshot && (
                                                        <span
                                                            className={
                                                                'text-muted-foreground'
                                                            }
                                                        >
                                                            {' '}
                                                            ·{' '}
                                                            {
                                                                item.variant_name_snapshot
                                                            }
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <strong
                                                className={
                                                    'shrink-0 text-foreground'
                                                }
                                            >
                                                {money(item.line_total)}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className={
                                        'relative mt-auto flex items-end justify-between gap-3 border-t border-foreground/10 bg-gradient-to-r from-brand-dark/40 via-brand/10 to-transparent px-6 py-4'
                                    }
                                >
                                    <span
                                        className={
                                            'text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase'
                                        }
                                    >
                                        Total
                                    </span>
                                    <strong
                                        className={
                                            'font-display text-3xl leading-none tracking-wide text-brand-light'
                                        }
                                    >
                                        {money(orderTotal(order))}
                                    </strong>
                                </div>
                            </article>
                        ))}
                        {filteredOrders.length === 0 && orders.length > 0 && (
                            <p
                                className={
                                    'col-span-full rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground'
                                }
                            >
                                Ningún pedido coincide con tu búsqueda.
                            </p>
                        )}
                        {orders.length === 0 && (
                            <div
                                className={
                                    'col-span-full rounded-3xl border border-dashed p-10 text-center'
                                }
                            >
                                <p className={'text-sm text-muted-foreground'}>
                                    Todavía no tienes pedidos asociados.
                                </p>
                                <Button
                                    asChild
                                    className={
                                        'mt-4 bg-brand text-white hover:bg-brand-hover'
                                    }
                                >
                                    <Link href={store.index()}>
                                        Ir a la tienda
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                    <ClientPagination
                        page={currentPage}
                        pageCount={pageCount}
                        onChange={goToPage}
                        label={'Paginación de pedidos'}
                    />
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
