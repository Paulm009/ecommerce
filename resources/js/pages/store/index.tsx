import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    PackageSearch,
    Search,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ProductDetailModal } from '@/components/store/product-detail-modal';
import type { ProductDetail } from '@/components/store/product-detail-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addCartItem } from '@/lib/cart';
import { money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import { login } from '@/routes';
import store from '@/routes/store';
import type { Auth } from '@/types';

type Product = ProductDetail & {
    id: string;
    slug: string;
    is_featured: boolean;
};

export default function StoreIndex({
    products,
    categories,
    filters,
}: {
    products: Paginated<Product>;
    categories: {
        id: string;
        name: string;
        slug: string;
        image_url?: string | null;
    }[];
    filters: {
        search: string;
        category: string;
        minPrice: string;
        maxPrice: string;
    };
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [search, setSearch] = useState(filters.search);
    const [category, setCategory] = useState(filters.category);
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const scrollCategories = (direction: 1 | -1) => {
        categoryScrollRef.current?.scrollBy({
            left: direction * 320,
            behavior: 'smooth',
        });
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            store.index().url,
            { search, category },
            {
                preserveState: true,
                preserveUrl: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };
    const clearFilters = () => {
        setSearch('');
        setCategory('');
        router.get(
            store.index().url,
            {},
            {
                preserveState: true,
                preserveUrl: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };
    const goToProductCategory = (slug: string) => {
        const next = category === slug ? '' : slug;
        setCategory(next);
        router.get(
            store.index().url,
            { search, category: next },
            {
                preserveState: true,
                preserveUrl: true,
                preserveScroll: true,
                replace: true,
            },
        );
        document
            .getElementById('catalogo')
            ?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleAddToCart = (product: Product) => {
        if (!auth.user) {
            toast.error('Inicia sesión para agregar productos al carrito.', {
                position: 'top-right',
            });
            router.visit(login().url);

            return;
        }

        const variant =
            product.variants.find(
                (item) => (item.inventory?.available_quantity ?? 0) > 0,
            ) ?? product.variants[0];
        const available = variant?.inventory?.available_quantity ?? 0;

        if (!variant || available < 1) {
            return;
        }

        addCartItem({
            product_variant_id: variant.id,
            product_name: product.name,
            variant_name: variant.name,
            sku: variant.sku,
            quantity: 1,
            unit_price: variant.sale_price,
            available_quantity: available,
        });
        toast.success(`${product.name} se agregó al carrito.`, {
            position: 'top-right',
        });
    };

    return (
        <>
            <Head title={'Tienda'} />

            {/* Hero: merch destacado del evento */}
            <section
                className={
                    'overflow-hidden border-b border-white/10 bg-black bg-[radial-gradient(circle_at_top_right,rgba(209,31,22,.28),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(124,25,22,.22),transparent_40%)]'
                }
            >
                <div
                    className={
                        'mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 px-4 py-10 sm:px-6 lg:min-h-[50vh] lg:flex-row lg:justify-between lg:gap-12 lg:py-0'
                    }
                >
                    <div className={'text-center lg:max-w-md lg:text-left'}>
                        <p
                            className={
                                'text-xs font-bold tracking-[.3em] text-brand-light uppercase'
                            }
                        >
                            Tienda oficial
                        </p>
                        <h1
                            className={
                                'mt-3 font-display text-4xl leading-[0.95] sm:text-6xl'
                            }
                        >
                            Llévate un <br />
                            recuerdo.
                        </h1>
                        <p
                            className={
                                'mx-auto mt-4 max-w-sm text-white/70 lg:mx-0'
                            }
                        >
                            Merch exclusivo del evento para llevarte un
                            pedacito de la experiencia.
                        </p>
                        <Button
                            asChild
                            className={
                                'mt-6 rounded-full bg-brand px-8 text-white hover:bg-brand-hover'
                            }
                        >
                            <a href={'#catalogo'}>
                                Ver catálogo
                                <ArrowDown className={'size-4'} />
                            </a>
                        </Button>
                    </div>

                    <img
                        src={'/images/store/hero-merch.png'}
                        alt={'Merch oficial del evento'}
                        className={
                            'max-h-[32vh] w-auto object-contain sm:max-h-[38vh] lg:max-h-[42vh]'
                        }
                    />
                </div>
            </section>

            {/* Catálogo */}
            <section
                id={'catalogo'}
                className={'mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6'}
            >
                <h2 className={'text-2xl font-black sm:text-3xl'}>Catálogo</h2>

                <div className={'mt-6 flex items-center justify-between gap-4'}>
                    <h3
                        className={
                            'text-xs font-bold tracking-[.25em] text-brand-light uppercase'
                        }
                    >
                        Categorías
                    </h3>
                    {category && (
                        <button
                            type={'button'}
                            onClick={() => goToProductCategory(category)}
                            className={
                                'text-xs font-bold text-zinc-400 uppercase hover:text-white'
                            }
                        >
                            Quitar filtro
                        </button>
                    )}
                </div>
                <div className={'relative mt-4'}>
                    <button
                        type={'button'}
                        onClick={() => scrollCategories(-1)}
                        aria-label={'Categoría anterior'}
                        className={
                            'absolute top-1/2 left-0 z-10 hidden size-10 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition hover:border-brand/50 md:flex'
                        }
                    >
                        <ChevronLeft className={'size-5'} />
                    </button>

                    <div
                        ref={categoryScrollRef}
                        className={
                            'flex snap-x scroll-smooth [scrollbar-width:none] gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden'
                        }
                    >
                        {categories.map((item) => (
                            <button
                                key={`product-${item.id}`}
                                type={'button'}
                                onClick={() => goToProductCategory(item.slug)}
                                className={
                                    'group relative aspect-4/3 w-56 shrink-0 snap-start overflow-hidden border transition sm:w-72 ' +
                                    (category === item.slug
                                        ? 'border-brand'
                                        : 'border-white/10 hover:border-brand/50')
                                }
                            >
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className={
                                            'absolute inset-0 h-full w-full object-cover transition group-hover:scale-110'
                                        }
                                    />
                                ) : (
                                    <>
                                        {/* Imagen por defecto: la categoría aún no tiene imagen cargada. */}
                                        <div
                                            className={
                                                'absolute inset-0 bg-gradient-to-br from-brand/25 to-brand-dark/40'
                                            }
                                        />
                                        <ImageIcon
                                            className={
                                                'absolute inset-0 m-auto size-12 text-white/25 transition group-hover:scale-110'
                                            }
                                            aria-hidden={'true'}
                                        />
                                    </>
                                )}
                                <span
                                    className={
                                        'absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3 text-left text-base font-bold text-white'
                                    }
                                >
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        type={'button'}
                        onClick={() => scrollCategories(1)}
                        aria-label={'Siguiente categoría'}
                        className={
                            'absolute top-1/2 right-0 z-10 hidden size-10 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition hover:border-brand/50 md:flex'
                        }
                    >
                        <ChevronRight className={'size-5'} />
                    </button>
                </div>

                <form
                    onSubmit={submit}
                    className={
                        'mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row'
                    }
                >
                    <div className={'relative flex-1'}>
                        <Search
                            className={
                                'absolute top-4 left-4 size-5 text-zinc-500'
                            }
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={'Buscar productos'}
                            className={
                                'h-14 border-white/10 bg-zinc-900 pl-12 text-base'
                            }
                        />
                    </div>
                    <Button
                        className={
                            'h-14 bg-brand px-8 text-white hover:bg-brand-hover'
                        }
                    >
                        Buscar
                    </Button>
                </form>

                <div
                    className={
                        'mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }
                >
                    {products.data.map((product) => {
                        const available = product.variants.reduce(
                            (sum, item) =>
                                sum + (item.inventory?.available_quantity ?? 0),
                            0,
                        );
                        const soldOut = available < 1;

                        return (
                            <div
                                key={product.id}
                                className={
                                    'group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] transition hover:-translate-y-1 hover:border-brand/50'
                                }
                            >
                                <button
                                    type={'button'}
                                    onClick={() => setActiveProduct(product)}
                                    className={'block w-full text-left'}
                                >
                                    {/*
                                        Foto del producto.
                                        Reemplazar este bloque placeholder por:
                                        <img src={product.image_url} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
                                        (requiere exponer image_url del producto desde el backend)
                                    */}
                                    <div
                                        className={
                                            'relative grid aspect-square place-items-center border-b border-dashed border-white/10 bg-gradient-to-br from-brand/25 to-brand-dark/40'
                                        }
                                    >
                                        <ImageIcon
                                            className={
                                                'size-12 text-white/25 transition group-hover:scale-110'
                                            }
                                            aria-hidden={'true'}
                                        />
                                    </div>
                                    <div className={'p-5'}>
                                        <p
                                            className={
                                                'text-xs tracking-wider text-zinc-500 uppercase'
                                            }
                                        >
                                            {product.categories
                                                .map((item) => item.name)
                                                .join(' · ')}
                                        </p>
                                        <h3
                                            className={
                                                'mt-2 text-xl font-black'
                                            }
                                        >
                                            {product.name}
                                        </h3>
                                        <div
                                            className={
                                                'mt-5 flex items-center justify-between'
                                            }
                                        >
                                            <strong
                                                className={'text-brand-light'}
                                            >
                                                Desde{' '}
                                                {money(
                                                    product.variants[0]
                                                        ?.sale_price ?? 0,
                                                )}
                                            </strong>
                                            <span
                                                className={
                                                    'text-xs text-zinc-500'
                                                }
                                            >
                                                {available} disp.
                                            </span>
                                        </div>
                                    </div>
                                </button>
                                <div className={'mt-auto px-5 pb-5'}>
                                    <Button
                                        type={'button'}
                                        disabled={soldOut}
                                        onClick={() =>
                                            handleAddToCart(product)
                                        }
                                        className={
                                            'w-full bg-brand text-white hover:bg-brand-hover disabled:opacity-40'
                                        }
                                    >
                                        {soldOut
                                            ? 'Agotado'
                                            : 'Agregar al carrito'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {products.data.length === 0 && (
                    <div
                        className={
                            'mt-8 rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-400'
                        }
                    >
                        <PackageSearch className={'mx-auto mb-4'} />
                        No hay productos para estos filtros.
                        {(search || category) && (
                            <div className={'mt-4'}>
                                <Button
                                    type={'button'}
                                    variant={'outline'}
                                    onClick={clearFilters}
                                >
                                    Limpiar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {(products.prev_page_url || products.next_page_url) && (
                    <div className={'mt-10 flex justify-center gap-3'}>
                        {products.prev_page_url && (
                            <Button asChild variant={'outline'}>
                                <Link href={products.prev_page_url}>
                                    Anterior
                                </Link>
                            </Button>
                        )}
                        {products.next_page_url && (
                            <Button asChild variant={'outline'}>
                                <Link href={products.next_page_url}>
                                    Siguiente
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </section>

            <ProductDetailModal
                product={activeProduct}
                onOpenChange={(open) => !open && setActiveProduct(null)}
            />
        </>
    );
}
