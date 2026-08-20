import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clearCart, readCart, writeCart } from '@/lib/cart';
import type { CartItem } from '@/lib/cart';
import { money, sessionToken } from '@/lib/platform';
import productOrders from '@/routes/product-orders';
import store from '@/routes/store';
import type { Auth } from '@/types';
import { RegisterModal } from './register-modal';
import type { RegisteredData } from './register-modal';

export function CartView() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [items, setItems] = useState<CartItem[]>(readCart);
    const form = useForm({
        buyer_name: auth.user?.name ?? '',
        buyer_email: auth.user?.email ?? '',
        buyer_phone: String(auth.user?.phone ?? ''),
        buyer_identity_document: '',
        session_token: sessionToken(),
        items: [] as Array<{
            product_variant_id: string;
            quantity: number;
        }>,
    });

    const total = useMemo(
        () =>
            items.reduce(
                (sum, item) => sum + Number(item.unit_price) * item.quantity,
                0,
            ),
        [items],
    );
    const updateItems = (next: CartItem[]) => {
        setItems(next);
        writeCart(next);
    };
    const changeQuantity = (variantId: string, delta: number) =>
        updateItems(
            items.map((item) =>
                item.product_variant_id === variantId
                    ? {
                          ...item,
                          quantity: Math.max(
                              1,
                              Math.min(
                                  item.available_quantity,
                                  item.quantity + delta,
                              ),
                          ),
                      }
                    : item,
            ),
        );
    const [registerOpen, setRegisterOpen] = useState(false);
    const [registerKey, setRegisterKey] = useState(0);
    const submitOrder = () => {
        form.transform((data) => ({
            ...data,
            items: items.map((item) => ({
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
            })),
        }));
        form.post(productOrders.store().url, {
            onSuccess: () => clearCart(),
        });
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!auth.user) {
            setRegisterKey((key) => key + 1);
            setRegisterOpen(true);

            return;
        }

        submitOrder();
    };
    const handleRegistered = (data: RegisteredData) => {
        form.setData({
            buyer_name: data.name,
            buyer_email: data.email,
            buyer_phone: data.phone || form.data.buyer_phone,
        });
        router.reload({
            only: ['auth'],
            onFinish: submitOrder,
        });
    };

    return (
        <section className={'mx-auto max-w-7xl px-4 py-14 sm:px-6'}>
            <div className={'mb-9 flex items-center gap-4'}>
                <span
                    className={
                        'grid size-12 place-items-center rounded-xl bg-cyan-400 text-zinc-950'
                    }
                >
                    <ShoppingCart />
                </span>
                <div>
                    <p
                        className={
                            'text-sm font-bold tracking-[.2em] text-cyan-300 uppercase'
                        }
                    >
                        Tienda oficial
                    </p>
                    <h1 className={'text-4xl font-black'}>Tu carrito</h1>
                </div>
            </div>
            {items.length === 0 ? (
                <div
                    className={
                        'rounded-2xl border border-dashed border-white/15 p-12 text-center'
                    }
                >
                    <p className={'text-zinc-400'}>El carrito esta vacio.</p>
                    <Button
                        asChild
                        className={
                            'mt-5 bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                        }
                    >
                        <Link href={store.index()}>Explorar productos</Link>
                    </Button>
                </div>
            ) : (
                <form
                    onSubmit={submit}
                    className={'grid gap-8 lg:grid-cols-[1fr_420px]'}
                >
                    <div className={'space-y-4'}>
                        {items.map((item) => (
                            <article
                                key={item.product_variant_id}
                                className={
                                    'flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5 sm:flex-row sm:items-center'
                                }
                            >
                                <span
                                    className={
                                        'grid size-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600'
                                    }
                                >
                                    <ShoppingCart />
                                </span>
                                <div className={'min-w-0 flex-1'}>
                                    <h2 className={'font-black'}>
                                        {item.product_name}
                                    </h2>
                                    <p className={'text-sm text-zinc-500'}>
                                        {item.variant_name ?? 'Unica'} ·{' '}
                                        {item.sku}
                                    </p>
                                    <strong
                                        className={'mt-2 block text-cyan-300'}
                                    >
                                        {money(item.unit_price)}
                                    </strong>
                                </div>
                                <div className={'flex items-center gap-2'}>
                                    <Button
                                        type={'button'}
                                        size={'icon'}
                                        variant={'outline'}
                                        onClick={() =>
                                            changeQuantity(
                                                item.product_variant_id,
                                                -1,
                                            )
                                        }
                                    >
                                        <Minus />
                                    </Button>
                                    <span
                                        className={
                                            'w-8 text-center font-bold'
                                        }
                                    >
                                        {item.quantity}
                                    </span>
                                    <Button
                                        type={'button'}
                                        size={'icon'}
                                        variant={'outline'}
                                        onClick={() =>
                                            changeQuantity(
                                                item.product_variant_id,
                                                1,
                                            )
                                        }
                                    >
                                        <Plus />
                                    </Button>
                                    <Button
                                        type={'button'}
                                        size={'icon'}
                                        variant={'ghost'}
                                        onClick={() =>
                                            updateItems(
                                                items.filter(
                                                    (candidate) =>
                                                        candidate.product_variant_id !==
                                                        item.product_variant_id,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                    <aside
                        className={
                            'h-fit rounded-2xl border border-white/10 bg-white/[.04] p-6'
                        }
                    >
                        <h2 className={'text-2xl font-black'}>
                            Finalizar compra
                        </h2>
                        {!auth.user && (
                            <div className={'mt-5 space-y-4'}>
                                {[
                                    ['buyer_name', 'Nombre completo', 'text'],
                                    ['buyer_email', 'Correo', 'email'],
                                    ['buyer_phone', 'Telefono', 'tel'],
                                    [
                                        'buyer_identity_document',
                                        'Documento',
                                        'text',
                                    ],
                                ].map(([field, label, type]) => (
                                    <div key={field} className={'space-y-2'}>
                                        <Label>{label}</Label>
                                        <Input
                                            type={type}
                                            value={
                                                form.data[
                                                    field as keyof typeof form.data
                                                ] as string
                                            }
                                            onChange={(event) =>
                                                form.setData(
                                                    field as keyof typeof form.data,
                                                    event.target
                                                        .value as never,
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
                        )}
                        {form.errors.items && (
                            <p className={'mt-4 text-sm text-red-400'}>
                                {form.errors.items}
                            </p>
                        )}
                        <div
                            className={
                                'mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-xl'
                            }
                        >
                            <span>Total</span>
                            <strong>{money(total)}</strong>
                        </div>
                        <Button
                            className={
                                'mt-5 w-full bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                            }
                            disabled={form.processing || items.length === 0}
                        >
                            Generar pago QR
                        </Button>
                        <p className={'mt-4 flex gap-2 text-xs text-zinc-500'}>
                            <ShieldCheck className={'size-4'} />
                            El stock queda reservado durante el pago.
                        </p>
                    </aside>
                </form>
            )}
            <RegisterModal
                key={registerKey}
                open={registerOpen}
                onOpenChange={setRegisterOpen}
                initialName={form.data.buyer_name}
                initialEmail={form.data.buyer_email}
                initialPhone={form.data.buyer_phone}
                onRegistered={handleRegistered}
            />
        </section>
    );
}
