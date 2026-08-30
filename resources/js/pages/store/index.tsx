import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    PackageSearch,
    Search,
} from 'lucide-react';
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ProductDetailModal } from '@/components/store/product-detail-modal';
import type { ProductDetail } from '@/components/store/product-detail-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addCartItem } from '@/lib/cart';
import { money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import { storeProductImage } from '@/lib/store-images';
import store from '@/routes/store';

type Product = ProductDetail & {
    id: string;
    is_featured: boolean;
};

const heroImages = [
    '/images/store/hero-merch.png',
    '/images/store/merch1.png',
    '/images/store/merch2.png',
    '/images/store/merch3.png',
    '/images/store/merch4.png',
    '/images/store/merch5.png',
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
    const [search, setSearch] = useState(filters.search);
    const [category, setCategory] = useState(filters.category);
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const [heroImageIndex, setHeroImageIndex] = useState(0);
    const [heroImageVisible, setHeroImageVisible] = useState(true);
    const featuredCount = featuredProducts.length;
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const dragStartX = useRef<number | null>(null);
    const goFeatured = (delta: number) =>
        setFeaturedIndex((index) =>
            featuredCount > 0
                ? (index + delta + featuredCount) % featuredCount
                : 0,
        );
    // Distancia con signo más corta hasta la tarjeta actual (para que las
    // vecinas se repartan a izquierda y derecha, con wrap continuo).
    const featuredOffset = (index: number) => {
        if (featuredCount === 0) {
            return 0;
        }

        let offset = index - featuredIndex;

        if (offset > featuredCount / 2) {
            offset -= featuredCount;
        }

        if (offset < -featuredCount / 2) {
            offset += featuredCount;
        }

        return offset;
    };
    const onFeaturedPointerDown = (event: ReactPointerEvent) => {
        dragStartX.current = event.clientX;
    };
    const onFeaturedPointerUp = (event: ReactPointerEvent) => {
        if (dragStartX.current === null) {
            return;
        }

        const dx = event.clientX - dragStartX.current;
        dragStartX.current = null;

        if (dx > 50) {
            goFeatured(-1);
        } else if (dx < -50) {
            goFeatured(1);
        }
    };

    // Cambia la imagen del hero cada 4s con un fundido.
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroImageVisible(false);
            setTimeout(() => {
                setHeroImageIndex(
                    (index) => (index + 1) % heroImages.length,
                );
                setHeroImageVisible(true);
            }, 300);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Avanza el carrusel de destacados cada 4s; se reinicia al navegar a mano.
    useEffect(() => {
        if (featuredCount < 2) {
            return;
        }

        const interval = setInterval(() => {
            setFeaturedIndex((index) => (index + 1) % featuredCount);
        }, 4000);

        return () => clearInterval(interval);
    }, [featuredCount, featuredIndex]);

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

            {/* Hero */}
            <section className={'relative overflow-hidden bg-black text-white'}>
                <div
                    className={
                        'relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-12 pb-4 sm:px-10 lg:pt-16 lg:pb-28'
                    }
                >
                    <div
                        className={
                            'flex items-baseline justify-between gap-4 text-[0.68rem] font-semibold tracking-[.28em] text-white/45 uppercase'
                        }
                    >
                        <span>Tienda oficial</span>
                        <span>Merch del evento</span>
                    </div>

                    <h1
                        className={
                            'mt-8 font-display text-[clamp(3.25rem,13vw,10.5rem)] leading-[0.82] uppercase sm:mt-10'
                        }
                    >
                        <span
                            className={
                                'mb-3 block font-sans text-[0.22em] font-black tracking-[.05em] text-white/65'
                            }
                        >
                            Llévate un
                        </span>
                        Recuerdo.
                    </h1>

                    <div className={'mt-8'}>
                        <p
                            className={
                                'text-sm leading-relaxed text-white/55 sm:whitespace-nowrap'
                            }
                        >
                            Merch exclusivo del evento para llevarte un pedacito de la experiencia.
                        </p>
                        <a
                            href={'#catalogo'}
                            className={
                                'group mt-8 inline-flex items-center gap-3 border-b border-white/30 pb-1 text-sm font-semibold tracking-[.15em] uppercase transition-colors hover:border-white'
                            }
                        >
                            Ver catálogo
                            <ArrowRight
                                className={
                                    'size-4 transition-transform group-hover:translate-x-1.5'
                                }
                            />
                        </a>
                    </div>
                </div>

                <img
                    src={heroImages[heroImageIndex]}
                    alt={'Merch oficial del evento'}
                    className={
                        'pointer-events-none mx-auto -mt-2 mb-8 block w-[86%] max-w-xs object-contain transition-opacity duration-300 select-none [filter:contrast(1.05)_saturate(1.05)] sm:max-w-sm lg:absolute lg:right-[14%] lg:bottom-0 lg:z-0 lg:m-0 lg:w-[52%] lg:max-w-[780px] lg:[mask-image:linear-gradient(to_top,transparent,#000_20%)] ' +
                        (heroImageVisible
                            ? 'opacity-100 lg:opacity-90'
                            : 'opacity-0')
                    }
                />


                <svg
                    aria-hidden={'true'}
                    viewBox={'0 0 1440 120'}
                    preserveAspectRatio={'none'}
                    className={
                        'pointer-events-none absolute inset-x-0 bottom-0 z-20 block h-10 w-full rotate-180 text-brand-dark sm:h-16 lg:h-28'
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
                        'relative flex min-h-[64vh] flex-col items-center justify-start bg-brand-dark pt-3 pb-24 sm:pt-4 sm:pb-32'
                    }
                >
                    <div
                        className={
                            'relative mx-auto w-full max-w-[1600px] px-6 sm:px-10'
                        }
                    >
                        <h2
                            className={
                                'text-3xl font-black text-white sm:text-4xl'
                            }
                        >
                            Productos destacados
                        </h2>
                    </div>

                    <div className={'relative w-full'}>
                        <button
                            type={'button'}
                            onClick={() => goFeatured(-1)}
                            aria-label={'Anterior'}
                            className={
                                'absolute top-1/2 left-2 z-40 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition hover:border-white/40 disabled:opacity-30 sm:left-6 md:flex'
                            }
                        >
                            <ChevronLeft className={'size-5'} />
                        </button>

                        <div
                            onPointerDown={onFeaturedPointerDown}
                            onPointerUp={onFeaturedPointerUp}
                            className={
                                'relative -mt-1 h-[48vh] max-h-[540px] min-h-[330px] w-full touch-pan-y overflow-hidden select-none sm:h-[52vh]'
                            }
                            style={{ perspective: '2200px' }}
                        >
                            {featuredProducts.map((product, index) => {
                                const available = product.variants.reduce(
                                    (sum, item) =>
                                        sum +
                                        (item.inventory?.available_quantity ??
                                            0),
                                    0,
                                );
                                const soldOut = available < 1;
                                // Las vecinas se van hacia atrás y a un lado,
                                // más pequeñas, sin cambiar de forma ni girar.
                                const offset = featuredOffset(index);
                                const abs = Math.abs(offset);
                                const isFront = offset === 0;
                                // Se apilan hasta la 3ª posición; las más lejanas
                                // se quedan ahí y solo se van desvaneciendo.
                                const stack = Math.max(-3, Math.min(3, offset));
                                const stackAbs = Math.abs(stack);

                                return (
                                    <div
                                        key={product.id}
                                        className={
                                            'absolute top-1/2 left-1/2 aspect-[4/5] h-[40vh] max-h-[460px] min-h-[260px] transition-all duration-700 ease-out will-change-transform sm:h-[44vh]'
                                        }
                                        style={{
                                            transform: `translate(-50%, -50%) translateX(${stack * 96}%) translateZ(${-stackAbs * 70}px) scale(${isFront ? 1.1 : 1 - stackAbs * 0.09})`,
                                            opacity:
                                                abs === 0
                                                    ? 1
                                                    : abs === 1
                                                      ? 0.85
                                                      : abs === 2
                                                        ? 0.65
                                                        : abs === 3
                                                          ? 0.45
                                                          : abs === 4
                                                            ? 0.22
                                                            : 0,
                                            zIndex: 20 - abs,
                                            pointerEvents:
                                                abs <= 2 ? 'auto' : 'none',
                                        }}
                                    >
                                        <div
                                            className={
                                                'relative h-full w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50'
                                            }
                                        >
                                            <button
                                                type={'button'}
                                                onClick={() => {
                                                    if (isFront) {
                                                        setActiveProduct(
                                                            product,
                                                        );
                                                    } else {
                                                        setFeaturedIndex(index);
                                                    }
                                                }}
                                                aria-label={product.name}
                                                className={
                                                    'absolute inset-0 block h-full w-full text-left'
                                                }
                                            >
                                                <img
                                                    src={storeProductImage(
                                                        product.slug,
                                                    )}
                                                    alt={product.name}
                                                    className={
                                                        'absolute inset-0 h-full w-full object-cover'
                                                    }
                                                />
                                                {!isFront && (
                                                    <div
                                                        className={
                                                            'absolute inset-0 bg-black/50'
                                                        }
                                                    />
                                                )}
                                            </button>
                                            {isFront && (
                                                <div
                                                    className={
                                                        'pointer-events-none absolute inset-x-0 bottom-0 bg-black/85 p-4 sm:p-5'
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
                                                            className={
                                                                'text-white'
                                                            }
                                                        >
                                                            Desde{' '}
                                                            {money(
                                                                product
                                                                    .variants[0]
                                                                    ?.sale_price ??
                                                                    0,
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
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type={'button'}
                            onClick={() => goFeatured(1)}
                            aria-label={'Siguiente'}
                            className={
                                'absolute top-1/2 right-2 z-40 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition hover:border-white/40 disabled:opacity-30 sm:right-6 md:flex'
                            }
                        >
                            <ChevronRight className={'size-5'} />
                        </button>

                        {featuredCount > 1 && (
                            <div
                                className={
                                    'mt-5 flex items-center justify-center gap-2 sm:mt-6'
                                }
                            >
                                {featuredProducts.map((product, index) => (
                                    <button
                                        key={product.id}
                                        type={'button'}
                                        onClick={() => setFeaturedIndex(index)}
                                        aria-label={`Ir a producto ${index + 1}`}
                                        className={
                                            'h-2 rounded-full transition-all ' +
                                            (index === featuredIndex
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
                <h2 className={'text-3xl font-black sm:text-4xl'}>Catálogo</h2>

                {category && (
                    <div className={'mt-6 flex justify-end'}>
                        <button
                            type={'button'}
                            onClick={() => goToProductCategory(category)}
                            className={
                                'text-xs font-bold text-zinc-400 uppercase hover:text-white'
                            }
                        >
                            Quitar filtro
                        </button>
                    </div>
                )}
                <div
                    className={
                        'group relative mt-6 -mx-6 overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] sm:-mx-10'
                    }
                >
                    <div
                        className={
                            'animate-marquee flex w-max group-hover:[animation-play-state:paused]'
                        }
                    >
                        {[0, 1].map((copy) => (
                            <ul
                                key={`cat-copy-${copy}`}
                                aria-hidden={copy === 1}
                                className={
                                    'flex shrink-0 list-none items-center gap-x-12 pr-12 sm:gap-x-20 sm:pr-20'
                                }
                            >
                                {categories.map((item) => {
                                    const active = category === item.slug;

                                    return (
                                        <li key={`cat-${copy}-${item.id}`}>
                                            <button
                                                type={'button'}
                                                onClick={() =>
                                                    goToProductCategory(
                                                        item.slug,
                                                    )
                                                }
                                                tabIndex={copy === 1 ? -1 : 0}
                                                className={
                                                    'block px-3 py-2 font-display text-3xl leading-none tracking-wide whitespace-nowrap uppercase transition-colors duration-200 hover:animate-shine hover:bg-[linear-gradient(110deg,rgba(255,255,255,0.35)_35%,#ffffff_50%,rgba(255,255,255,0.35)_65%)] hover:bg-clip-text hover:text-transparent hover:[background-size:200%_auto] sm:text-5xl ' +
                                                    (active
                                                        ? 'text-white'
                                                        : 'text-white/40')
                                                }
                                            >
                                                {item.name}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ))}
                    </div>
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
                                    <div
                                        className={
                                            'relative grid aspect-square place-items-center overflow-hidden border-b border-dashed border-white/10 bg-gradient-to-br from-brand/25 to-brand-dark/40'
                                        }
                                    >
                                        <img
                                            src={storeProductImage(product.slug)}
                                            alt={product.name}
                                            className={
                                                'absolute inset-0 h-full w-full object-cover transition group-hover:scale-110'
                                            }
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
