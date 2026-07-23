import { Head, router, useForm } from '@inertiajs/react';
import { Barcode, Search, ShoppingCart } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
    FieldError,
    PageHeader,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money } from '@/lib/platform';
import pos from '@/routes/pos';
import sales from '@/routes/pos/sales';

type Variant = {
    id: string;
    name: string | null;
    sku: string;
    barcode: string | null;
    sale_price: string;
    product: { name: string; status: string };
    inventory: { available_quantity: number } | null;
};
type Session = { id: string; session_number: string; status: string } | null;

export default function Pos({
    variants,
    cashSession,
    filters,
}: {
    variants: Variant[];
    cashSession: Session;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [cart, setCart] = useState<Record<string, number>>({});
    const form = useForm({
        cash_session_id: cashSession?.id ?? '',
        items: [] as { product_variant_id: string; quantity: number }[],
    });
    const total = useMemo(
        () =>
            variants.reduce(
                (sum, variant) =>
                    sum + Number(variant.sale_price) * (cart[variant.id] ?? 0),
                0,
            ),
        [cart, variants],
    );
    const checkout = () => {
        form.setData(
            'items',
            Object.entries(cart)
                .filter(([, quantity]) => quantity > 0)
                .map(([product_variant_id, quantity]) => ({
                    product_variant_id,
                    quantity,
                })),
        );
        setTimeout(() => form.post(sales.store().url), 0);
    };

    return (
        <>
            <Head title={'Punto de venta'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Venta presencial'}
                    title={'Punto de venta'}
                    description={
                        'Stock compartido con la tienda web y pago QR asociado a la caja abierta.'
                    }
                    action={
                        cashSession ? (
                            <StateBadge status={cashSession.status} />
                        ) : (
                            <StateBadge status={'closed'} />
                        )
                    }
                />
                <div className={'grid gap-6 xl:grid-cols-[1fr_360px]'}>
                    <Panel>
                        <form
                            onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                router.get(
                                    pos.index().url,
                                    { search },
                                    { preserveState: true },
                                );
                            }}
                            className={'mb-5 flex gap-2'}
                        >
                            <div className={'relative flex-1'}>
                                <Barcode
                                    className={
                                        'absolute top-3 left-3 size-4 text-muted-foreground'
                                    }
                                />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={
                                        'Buscar SKU o código de barras'
                                    }
                                    className={'pl-9'}
                                />
                            </div>
                            <Button variant={'outline'}>
                                <Search />
                            </Button>
                        </form>
                        <div
                            className={
                                'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
                            }
                        >
                            {variants.map((variant) => (
                                <article
                                    key={variant.id}
                                    className={'rounded-xl border p-4'}
                                >
                                    <p
                                        className={
                                            'text-xs text-muted-foreground'
                                        }
                                    >
                                        {variant.sku}
                                    </p>
                                    <h2 className={'mt-1 font-bold'}>
                                        {variant.product.name}
                                    </h2>
                                    <p
                                        className={
                                            'text-sm text-muted-foreground'
                                        }
                                    >
                                        {variant.name}
                                    </p>
                                    <div
                                        className={
                                            'mt-4 flex items-end justify-between'
                                        }
                                    >
                                        <span>
                                            <strong>
                                                {money(variant.sale_price)}
                                            </strong>
                                            <small
                                                className={
                                                    'block text-muted-foreground'
                                                }
                                            >
                                                {variant.inventory
                                                    ?.available_quantity ??
                                                    0}{' '}
                                                disp.
                                            </small>
                                        </span>
                                        <Button
                                            size={'sm'}
                                            disabled={
                                                !cashSession ||
                                                (variant.inventory
                                                    ?.available_quantity ??
                                                    0) <=
                                                    (cart[variant.id] ?? 0)
                                            }
                                            onClick={() =>
                                                setCart({
                                                    ...cart,
                                                    [variant.id]:
                                                        (cart[variant.id] ??
                                                            0) + 1,
                                                })
                                            }
                                        >
                                            Agregar
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </Panel>
                    <Panel
                        title={'Carrito'}
                        description={
                            cashSession
                                ? `Caja ${cashSession.session_number}`
                                : 'Debes abrir la caja antes de vender.'
                        }
                    >
                        <div className={'space-y-3'}>
                            {Object.entries(cart)
                                .filter(([, quantity]) => quantity > 0)
                                .map(([id, quantity]) => {
                                    const variant = variants.find(
                                        (item) => item.id === id,
                                    )!;

                                    return (
                                        <div
                                            key={id}
                                            className={
                                                'flex items-center justify-between rounded-lg border p-3 text-sm'
                                            }
                                        >
                                            <span>
                                                {variant.product.name}
                                                <small
                                                    className={
                                                        'block text-muted-foreground'
                                                    }
                                                >
                                                    {quantity} ×{' '}
                                                    {money(variant.sale_price)}
                                                </small>
                                            </span>
                                            <div className={'flex gap-2'}>
                                                <Button
                                                    size={'icon'}
                                                    variant={'outline'}
                                                    onClick={() =>
                                                        setCart({
                                                            ...cart,
                                                            [id]: Math.max(
                                                                0,
                                                                quantity - 1,
                                                            ),
                                                        })
                                                    }
                                                >
                                                    −
                                                </Button>
                                                <strong>{quantity}</strong>
                                                <Button
                                                    size={'icon'}
                                                    variant={'outline'}
                                                    onClick={() =>
                                                        setCart({
                                                            ...cart,
                                                            [id]: quantity + 1,
                                                        })
                                                    }
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            {total === 0 && (
                                <p
                                    className={
                                        'py-8 text-center text-sm text-muted-foreground'
                                    }
                                >
                                    Agrega productos para comenzar.
                                </p>
                            )}
                        </div>
                        <div
                            className={
                                'mt-6 flex justify-between border-t pt-5 text-xl'
                            }
                        >
                            <span>Total</span>
                            <strong>{money(total)}</strong>
                        </div>
                        <Button
                            className={'mt-5 w-full'}
                            disabled={
                                !cashSession || total === 0 || form.processing
                            }
                            onClick={checkout}
                        >
                            <ShoppingCart />
                            Generar QR de pago
                        </Button>
                        <FieldError message={form.errors.items} />
                    </Panel>
                </div>
            </div>
        </>
    );
}

Pos.layout = { breadcrumbs: [{ title: 'Punto de venta', href: pos.index() }] };
