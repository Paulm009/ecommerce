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
import { useEffect, useRef, useState } from 'react';
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

const heroImages = [
    { src: '/images/store/hero-merch.png', alt: 'Merch oficial del evento' },
    { src: '/images/store/merch1.png', alt: 'Merch oficial del evento' },
    { src: '/images/store/merch2.png', alt: 'Merch oficial del evento' },
    { src: '/images/store/merch3.png', alt: 'Merch oficial del evento' },
    { src: '/images/store/merch4.png', alt: 'Merch oficial del evento' },
    { src: '/images/store/merch5.png', alt: 'Merch oficial del evento' },
];

export default function StoreIndex({
    products,
    featuredProducts,
    categories,
    filters,
}: {
    products: Paginated<Product>;
    featuredProducts: Product[];
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
    const [heroImageIndex, setHeroImageIndex] = useState(0);
    const [heroImageVisible, setHeroImageVisible] = useState(true);
    const featuredScrollRef = useRef<HTMLDivElement>(null);
    const [featuredDotIndex, setFeaturedDotIndex] = useState(0);
    const scrollFeatured = (direction: 1 | -1) => {
        featuredScrollRef.current?.scrollBy({
            left: direction * 600,
            behavior: 'smooth',
        });
    };
    const handleFeaturedScroll = () => {
        const container = featuredScrollRef.current;

        if (!container) {
            return;
        }

        const maxScroll = container.scrollWidth - container.clientWidth;
        const progress = maxScroll > 0 ? container.scrollLeft / maxScroll : 0;
        const index = Math.round(progress * (featuredProducts.length - 1));
        setFeaturedDotIndex(index);
    };
    const scrollFeaturedToIndex = (index: number) => {
        const container = featuredScrollRef.current;

        if (!container) {
            return;
        }

        const maxScroll = container.scrollWidth - container.clientWidth;
        const step =
            featuredProducts.length > 1
                ? maxScroll / (featuredProducts.length - 1)
                : 0;
        container.scrollTo({ left: step * index, behavior: 'smooth' });
    };

    useEffect(() => {
        if (heroImages.length < 2) {
            return;
        }

        const interval = setInterval(() => {
            setHeroImageVisible(false);
            setTimeout(() => {
                setHeroImageIndex((index) => (index + 1) % heroImages.length);
                setHeroImageVisible(true);
            }, 300);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

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
            position: 'bottom-right',
            style: { marginRight: '4.5rem' },
        });
    };

    return (
        <>
            <Head title={'Tienda'} />

            {/* Hero: merch destacado del evento */}
            <section className={'relative overflow-hidden bg-black'}>
                <div
                    className={
                        'mx-auto flex max-w-[1600px] flex-col-reverse items-center gap-8 px-6 py-10 sm:px-10 lg:min-h-[60vh] lg:flex-row lg:justify-start lg:gap-4 lg:py-0'
                    }
                >
                    <div
                        className={
                            'text-center lg:ml-56 lg:max-w-3xl lg:shrink-0 lg:text-left'
                        }
                    >
                        <p
                            className={
                                'text-xs font-bold tracking-[.3em] text-brand-light uppercase'
                            }
                        >
                            Tienda oficial
                        </p>
                        <h1
                            className={
                                'mt-3 text-6xl leading-[0.95] font-black tracking-wide [-webkit-text-stroke:2px_white] sm:text-8xl'
                            }
                        >
                            Llévate un <br />
                            recuerdo.
                        </h1>
                        <p
                            className={
                                'mx-auto mt-4 max-w-sm text-white/70 lg:mx-0 lg:max-w-md'
                            }
                        >
                            Merch exclusivo del evento para llevarte un pedacito
                            de la experiencia.
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
                        src={heroImages[heroImageIndex].src}
                        alt={heroImages[heroImageIndex].alt}
                        className={
                            'max-h-[48vh] w-auto max-w-full object-contain transition-opacity duration-300 sm:max-h-[56vh] lg:-ml-24 lg:max-h-[72vh] lg:max-w-6xl lg:shrink lg:self-end ' +
                            (heroImageVisible ? 'opacity-100' : 'opacity-0')
                        }
                    />
                </div>

                <svg
                    aria-hidden={'true'}
                    viewBox={'0 0 1440 120'}
                    preserveAspectRatio={'none'}
                    className={
                        'pointer-events-none absolute inset-x-0 bottom-0 block h-10 w-full rotate-180 text-brand-dark sm:h-16 lg:h-28'
                    }
                >
                    <path
                        fill={'currentColor'}
                        d={
                            'M0,0 L1440,0 L1440,40 C1280,56 1120,64 960,58 C800,53 680,38 520,42 C360,45 220,61 80,54 C48,52 16,47 0,44 Z'
                        }
                    />
                </svg>
            </section>

            {/* Productos destacados */}
            {featuredProducts.length > 0 && (
                <section
                    className={
                        'relative flex min-h-[30vh] flex-col items-center justify-center bg-brand-dark'
                    }
                >
                    <div
                        className={
                            'relative mx-auto w-full max-w-[1600px] px-6 pt-2 sm:px-10 sm:pt-3'
                        }
                    >
                        <h2
                            className={
                                'text-2xl font-black text-white sm:text-3xl'
                            }
                        >
                            Productos destacados
                        </h2>
                    </div>

                    <div className={'relative mt-3 w-full pb-20 sm:pb-28'}>
                        <button
                            type={'button'}
                            onClick={() => scrollFeatured(-1)}
                            aria-label={'Anterior'}
                            className={
                                'absolute top-1/2 left-2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition hover:border-white/40 md:flex'
                            }
                        >
                            <ChevronLeft className={'size-5'} />
                        </button>

                        <div
                            ref={featuredScrollRef}
                            onScroll={handleFeaturedScroll}
                            className={
                                'flex scroll-pl-6 [scrollbar-width:none] gap-6 overflow-x-auto overflow-y-visible py-14 pr-4 pl-6 sm:scroll-pl-10 sm:pl-10 [&::-webkit-scrollbar]:hidden'
                            }
                            style={{ scrollSnapType: 'x proximity' }}
                        >
                            {featuredProducts.map((product) => {
                                const available = product.variants.reduce(
                                    (sum, item) =>
                                        sum +
                                        (item.inventory?.available_quantity ??
                                            0),
                                    0,
                                );
                                const soldOut = available < 1;

                                return (
                                    <div
                                        key={product.id}
                                        className={
                                            'peer group relative aspect-square w-96 shrink-0 origin-left snap-start overflow-hidden rounded-2xl border border-black/10 shadow-lg shadow-black/10 transition-transform duration-200 ease-out will-change-transform peer-hover:translate-x-10 hover:z-20 hover:scale-[1.15] sm:w-[28rem]'
                                        }
                                    >
                                        <button
                                            type={'button'}
                                            onClick={() =>
                                                setActiveProduct(product)
                                            }
                                            className={
                                                'absolute inset-0 block h-full w-full text-left'
                                            }
                                        >
                                            {/*
                                                Foto del producto destacado.
                                                Reemplazar este bloque placeholder por:
                                                <img src={product.image_url} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
                                                (requiere exponer image_url del producto desde el backend)
                                            */}
                                            <div
                                                className={
                                                    'absolute inset-0 bg-gradient-to-br from-white/25 to-white/5'
                                                }
                                            />
                                            <ImageIcon
                                                className={
                                                    'absolute inset-0 m-auto size-14 text-white/50 transition group-hover:scale-110'
                                                }
                                                aria-hidden={'true'}
                                            />
                                        </button>
                                        <div
                                            className={
                                                'pointer-events-none absolute inset-x-0 bottom-0 bg-black/85 p-5'
                                            }
                                        >
                                            <h3
                                                className={
                                                    'text-lg font-black text-white'
                                                }
                                            >
                                                {product.name}
                                            </h3>
                                            <div
                                                className={
                                                    'mt-3 flex items-center justify-between gap-3'
                                                }
                                            >
                                                <strong
                                                    className={'text-white'}
                                                >
                                                    Desde{' '}
                                                    {money(
                                                        product.variants[0]
                                                            ?.sale_price ?? 0,
                                                    )}
                                                </strong>
                                                <Button
                                                    type={'button'}
                                                    size={'sm'}
                                                    disabled={soldOut}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleAddToCart(
                                                            product,
                                                        );
                                                    }}
                                                    className={
                                                        'pointer-events-auto bg-white text-brand hover:bg-white/90 disabled:opacity-40'
                                                    }
                                                >
                                                    {soldOut
                                                        ? 'Agotado'
                                                        : 'Agregar'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type={'button'}
                            onClick={() => scrollFeatured(1)}
                            aria-label={'Siguiente'}
                            className={
                                'absolute top-1/2 right-2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition hover:border-white/40 md:flex'
                            }
                        >
                            <ChevronRight className={'size-5'} />
                        </button>

                        {featuredProducts.length > 1 && (
                            <div
                                className={
                                    'mt-2 flex items-center justify-center gap-2'
                                }
                            >
                                {featuredProducts.map((product, index) => (
                                    <button
                                        key={product.id}
                                        type={'button'}
                                        onClick={() =>
                                            scrollFeaturedToIndex(index)
                                        }
                                        aria-label={`Ir a producto ${index + 1}`}
                                        className={
                                            'h-2 rounded-full transition-all ' +
                                            (index === featuredDotIndex
                                                ? 'w-6 bg-white'
                                                : 'w-2 bg-white/30 hover:bg-white/50')
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <svg
                        aria-hidden={'true'}
                        viewBox={'0 0 1440 120'}
                        preserveAspectRatio={'none'}
                        className={
                            'pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full rotate-180 text-black sm:h-24'
                        }
                    >
                        <path
                            fill={'currentColor'}
                            d={
                                'M0,0 L1440,0 L1440,40 C1280,56 1120,64 960,58 C800,53 680,38 520,42 C360,45 220,61 80,54 C48,52 16,47 0,44 Z'
                            }
                        />
                    </svg>
                </section>
            )}

            {/* Catálogo */}
            <section
                id={'catalogo'}
            
                className={'mx-auto max-w-[1600px] scroll-mt-20 px-6 py-14 sm:px-10'}
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
                <div
                    className={
                        'mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'
                    }
                >
                    {categories.map((item) => (
                        <button
                            key={`product-${item.id}`}
                            type={'button'}
                            onClick={() => goToProductCategory(item.slug)}
                            className={
                                'group relative aspect-[4/5] overflow-hidden rounded-2xl border transition ' +
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
                                        onClick={() => handleAddToCart(product)}
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
