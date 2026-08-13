import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import AuthRequiredDialog from '@/components/store/auth-required-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addCartItem } from '@/lib/cart';
import { money, sessionToken } from '@/lib/platform';
import productOrders from '@/routes/product-orders';
import store from '@/routes/store';
import type { Auth } from '@/types';

type Variant = {
    id: string;
    name: string | null;
    sku: string;
    sale_price: string;
    attributes_json: Record<string, string> | null;
    inventory: { available_quantity: number } | null;
};
type Product = {
    name: string;
    description: string | null;
    product_type: string;
    categories: { name: string }[];
    variants: Variant[];
};

export default function StoreShow({ product }: { product: Product }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const form = useForm({
        buyer_name: '',
        buyer_email: '',
        buyer_phone: '',
        buyer_identity_document: '',
        session_token: sessionToken(),
        items: [
            { product_variant_id: product.variants[0]?.id ?? '', quantity: 1 },
        ],
    });
    const selected = product.variants.find(
        (variant) => variant.id === form.data.items[0].product_variant_id,
    );
    const quantity = form.data.items[0].quantity;
    const setItem = (changes: Partial<(typeof form.data.items)[0]>) =>
        form.setData('items', [{ ...form.data.items[0], ...changes }]);

    return (
        <>
            <Head title={product.name} />
            <section
                className={
                    'mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2'
                }
            >
                <div
                    className={
                        'grid aspect-square place-items-center rounded-[2rem] bg-gradient-to-br from-cyan-500 via-blue-600 to-fuchsia-700'
                    }
                >
                    <ShoppingBag className={'size-40 text-white/85'} />
                </div>
                <div>
                    <p
                        className={
                            'text-sm font-bold tracking-[.2em] text-cyan-300 uppercase'
                        }
                    >
                        {product.categories
                            .map((item) => item.name)
                            .join(' · ')}
                    </p>
                    <h1 className={'mt-4 text-4xl font-black sm:text-6xl'}>
                        {product.name}
                    </h1>
                    <p className={'mt-5 leading-8 text-zinc-400'}>
                        {product.description}
                    </p>
                    <div className={'mt-8 space-y-3'}>
                        {product.variants.map((variant) => (
                            <button
                                type={'button'}
                                key={variant.id}
                                disabled={
                                    (variant.inventory?.available_quantity ??
                                        0) < 1
                                }
                                onClick={() =>
                                    setItem({ product_variant_id: variant.id })
                                }
                                className={`flex w-full justify-between rounded-xl border p-4 text-left ${selected?.id === variant.id ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-white/[.03]'} disabled:opacity-40`}
                            >
                                <span>
                                    <strong>{variant.name ?? 'Única'}</strong>
                                    <small className={'block text-zinc-500'}>
                                        {variant.sku} ·{' '}
                                        {variant.inventory
                                            ?.available_quantity ?? 0}{' '}
                                        disponibles
                                    </small>
                                </span>
                                <strong>{money(variant.sale_price)}</strong>
                            </button>
                        ))}
                    </div>
                    <div
                        className={
                            'mt-6 flex items-center justify-between rounded-xl border border-white/10 p-4'
                        }
                    >
                        <span>Cantidad</span>
                        <div className={'flex items-center gap-3'}>
                            <Button
                                type={'button'}
                                size={'icon'}
                                variant={'outline'}
                                onClick={() =>
                                    setItem({
                                        quantity: Math.max(1, quantity - 1),
                                    })
                                }
                            >
                                <Minus />
                            </Button>
                            <span className={'w-8 text-center font-bold'}>
                                {quantity}
                            </span>
                            <Button
                                type={'button'}
                                size={'icon'}
                                variant={'outline'}
                                onClick={() =>
                                    setItem({
                                        quantity: Math.min(
                                            selected?.inventory
                                                ?.available_quantity ?? 1,
                                            quantity + 1,
                                        ),
                                    })
                                }
                            >
                                <Plus />
                            </Button>
                        </div>
                    </div>
                    <h2 className={'mt-10 text-2xl font-black'}>
                        Datos para el pedido
                    </h2>
                    <div className={'mt-5 grid gap-4 sm:grid-cols-2'}>
                        {[
                            [
                                'buyer_name',
                                'Nombre completo',
                                'Ana Pérez',
                                'text',
                            ],
                            [
                                'buyer_email',
                                'Correo',
                                'ana@ejemplo.com',
                                'email',
                            ],
                            ['buyer_phone', 'Teléfono', '+591 70000000', 'tel'],
                            [
                                'buyer_identity_document',
                                'Documento',
                                '1234567',
                                'text',
                            ],
                        ].map(([field, label, placeholder, type]) => (
                            <div key={field} className={'space-y-2'}>
                                <Label>{label}</Label>
                                <Input
                                    type={type}
                                    placeholder={placeholder}
                                    value={
                                        form.data[
                                            field as keyof typeof form.data
                                        ] as string
                                    }
                                    onChange={(e) =>
                                        form.setData(
                                            field as keyof typeof form.data,
                                            e.target.value as never,
                                        )
                                    }
                                    className={'border-white/10 bg-white/5'}
                                />
                                {form.errors[
                                    field as keyof typeof form.errors
                                ] && (
                                    <p className={'text-xs text-red-400'}>
                                        {
                                            form.errors[
                                                field as keyof typeof form.errors
                                            ]
                                        }
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <div
                        className={
                            'mt-8 flex items-center justify-between text-xl'
                        }
                    >
                        <span>Total</span>
                        <strong>
                            {money(
                                Number(selected?.sale_price ?? 0) * quantity,
                            )}
                        </strong>
                    </div>
                    <Button
                        className={
                            'mt-5 w-full bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                        }
                        disabled={!selected || form.processing}
                        onClick={() => {
                            if (!auth.user) {
                                setAuthDialogOpen(true);
                                return;
                            }

                            form.post(productOrders.store().url);
                        }}
                    >
                        Comprar con QR
                    </Button>
                    <Button
                        variant={'outline'}
                        className={'mt-3 w-full border-white/15 bg-transparent'}
                        disabled={!selected}
                        onClick={() => {
                            if (!selected) {
                                return;
                            }

                            addCartItem({
                                product_variant_id: selected.id,
                                product_name: product.name,
                                variant_name: selected.name,
                                sku: selected.sku,
                                quantity,
                                unit_price: selected.sale_price,
                                available_quantity:
                                    selected.inventory?.available_quantity ?? 0,
                            });
                            router.visit(store.cart().url);
                        }}
                    >
                        Agregar al carrito
                    </Button>
                    <p className={'mt-4 flex gap-2 text-xs text-zinc-500'}>
                        <ShieldCheck className={'size-4'} />
                        El stock se reserva hasta que venza el QR.
                    </p>
                </div>
            </section>
            <AuthRequiredDialog
                open={authDialogOpen}
                onOpenChange={setAuthDialogOpen}
            />
        </>
    );
}
