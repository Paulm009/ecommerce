import { Link, useForm, usePage } from '@inertiajs/react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { addCartItem } from '@/lib/cart';
import { money } from '@/lib/platform';
import { storeProductImage } from '@/lib/store-images';
import { login } from '@/routes';
import type { Auth } from '@/types';

export type ProductDetailVariant = {
    id: string;
    name: string | null;
    sku: string;
    sale_price: string;
    inventory: { available_quantity: number } | null;
};

export type ProductDetail = {
    name: string;
    slug: string;
    description: string | null;
    categories: { name: string }[];
    variants: ProductDetailVariant[];
};

export function ProductDetailView({
    product,
    onClose,
}: {
    product: ProductDetail;
    onClose?: () => void;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const form = useForm({
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
    // Cierra el modal contenedor (si lo hay) y ejecuta la acción en el
    // siguiente tick. Así Radix desmonta su overlay antes de que naveguemos
    // o abramos el carrito, y no queda la pantalla bloqueada en negro.
    const closeThen = (run: () => void) => {
        if (!onClose) {
            run();

            return;
        }

        onClose();
        window.setTimeout(run, 220);
    };
    const addItemToCart = () => {
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
        toast.success(`${product.name} se agregó al carrito.`, {
            position: 'bottom-right',
            style: { marginRight: '4.5rem' },
        });
    };
    const addToCartAndGo = () => {
        addItemToCart();
        window.dispatchEvent(new Event('eventa-cart-open-drawer'));
    };

    return (
        <section
            className={
                'mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2'
            }
        >
            <div
                className={
                    'grid aspect-square place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-500 via-blue-600 to-fuchsia-700'
                }
            >
                <img
                    src={storeProductImage(product.slug)}
                    alt={product.name}
                    className={'h-full w-full object-cover'}
                />
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
                    <Button
                        asChild
                        variant={'outline'}
                        className={'mt-10 w-full border-white/15 bg-transparent'}
                    >
                        <Link href={login()}>Iniciar sesión</Link>
                    </Button>
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
                    disabled={!selected}
                    onClick={() => closeThen(addToCartAndGo)}
                >
                    Agregar al carrito
                </Button>
                <p className={'mt-4 flex gap-2 text-xs text-zinc-500'}>
                    <ShoppingCart className={'size-4'} />
                    Para comprar, agrega el producto al carrito y finaliza la
                    compra desde allí.
                </p>
            </div>
        </section>
    );
}
