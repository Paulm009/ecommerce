import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addCartItem } from '@/lib/cart';
import { money, sessionToken } from '@/lib/platform';
import { login } from '@/routes';
import productOrders from '@/routes/product-orders';
import type { Auth } from '@/types';
import { RegisterModal } from './register-modal';
import type { RegisteredData } from './register-modal';

export type ProductDetailVariant = {
    id: string;
    name: string | null;
    sku: string;
    sale_price: string;
    inventory: { available_quantity: number } | null;
};

export type ProductDetail = {
    name: string;
    description: string | null;
    categories: { name: string }[];
    variants: ProductDetailVariant[];
};

export function ProductDetailView({
    product,
    onAddedToCart,
}: {
    product: ProductDetail;
    onAddedToCart?: () => void;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const form = useForm({
        buyer_name: auth.user?.name ?? '',
        buyer_email: auth.user?.email ?? '',
        buyer_phone: String(auth.user?.phone ?? ''),
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
    const [registerOpen, setRegisterOpen] = useState(false);
    const [registerKey, setRegisterKey] = useState(0);
    const pendingAction = useRef<'checkout' | 'cart' | null>(null);
    const submitOrder = () => form.post(productOrders.store().url);
    const addToCartAndGo = () => {
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
        window.dispatchEvent(new Event('eventa-cart-open-drawer'));
        onAddedToCart?.();
        toast.success(`${product.name} se agregó al carrito.`, {
            position: 'bottom-right',
            style: { marginRight: '4.5rem' },
        });
    };
    const openRegister = (action: 'checkout' | 'cart') => {
        pendingAction.current = action;
        setRegisterKey((key) => key + 1);
        setRegisterOpen(true);
    };
    const handleRegistered = (data: RegisteredData) => {
        form.setData({
            buyer_name: data.name,
            buyer_email: data.email,
            buyer_phone: data.phone || form.data.buyer_phone,
        });
        const action = pendingAction.current;
        pendingAction.current = null;
        router.reload({
            only: ['auth'],
            onFinish: () => {
                if (action === 'cart') {
                    addToCartAndGo();
                } else {
                    submitOrder();
                }
            },
        });
    };

    return (
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
                    {product.categories.map((item) => item.name).join(' · ')}
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
                                (variant.inventory?.available_quantity ?? 0) <
                                1
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
                                    {variant.inventory?.available_quantity ??
                                        0}{' '}
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
                {!auth.user && (
                    <div className={'mt-10'}>
                        <Button
                            asChild
                            className={
                                'w-full bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                            }
                        >
                            <Link href={login()}>Iniciar sesión</Link>
                        </Button>
                        <div
                            className={
                                'my-6 flex items-center gap-4 text-xs font-bold tracking-widest text-zinc-500 uppercase'
                            }
                        >
                            <span className={'h-px flex-1 bg-white/10'} />
                            o
                            <span className={'h-px flex-1 bg-white/10'} />
                        </div>
                    </div>
                )}
                {!auth.user && (
                    <>
                        <h2 className={'text-2xl font-black'}>
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
                                [
                                    'buyer_phone',
                                    'Teléfono',
                                    '+591 70000000',
                                    'tel',
                                ],
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
                                        className={
                                            'border-white/10 bg-white/5'
                                        }
                                    />
                                    {form.errors[
                                        field as keyof typeof form.errors
                                    ] && (
                                        <p
                                            className={
                                                'text-xs text-red-400'
                                            }
                                        >
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
                    </>
                )}
                <div
                    className={'mt-8 flex items-center justify-between text-xl'}
                >
                    <span>Total</span>
                    <strong>
                        {money(Number(selected?.sale_price ?? 0) * quantity)}
                    </strong>
                </div>
                <Button
                    className={
                        'mt-5 w-full bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                    }
                    disabled={!selected || form.processing}
                    onClick={() => {
                        if (!auth.user) {
                            openRegister('checkout');

                            return;
                        }

                        submitOrder();
                    }}
                >
                    Comprar con QR
                </Button>
                <Button
                    variant={'outline'}
                    className={'mt-3 w-full border-white/15 bg-transparent'}
                    disabled={!selected}
                    onClick={() => {
                        if (!auth.user) {
                            openRegister('cart');

                            return;
                        }

                        addToCartAndGo();
                    }}
                >
                    Agregar al carrito
                </Button>
                <p className={'mt-4 flex gap-2 text-xs text-zinc-500'}>
                    <ShieldCheck className={'size-4'} />
                    El stock se reserva hasta que venza el QR.
                </p>
            </div>
            <RegisterModal
                key={registerKey}
                open={registerOpen}
                onOpenChange={(open) => {
                    setRegisterOpen(open);

                    if (!open) {
                        pendingAction.current = null;
                    }
                }}
                initialName={form.data.buyer_name}
                initialEmail={form.data.buyer_email}
                initialPhone={form.data.buyer_phone}
                onRegistered={handleRegistered}
            />
        </section>
    );
}
