import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    Image as ImageIcon,
    PackageSearch,
    Search,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import store from '@/routes/store';

type Product = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_featured: boolean;
    categories: { name: string }[];
    variants: {
        sale_price: string;
        inventory: { available_quantity: number } | null;
    }[];
};

// TODO: reemplazar por datos reales cuando exista un modelo de menú en el backend.
const MENU = [
    {
        title: 'Bebidas',
        items: [
            { name: 'Café americano', price: 12 },
            { name: 'Café con leche', price: 14 },
            { name: 'Té e infusiones', price: 10 },
            { name: 'Jugo natural', price: 15 },
        ],
    },
    {
        title: 'Snacks',
        items: [
            { name: 'Croissant', price: 18 },
            { name: 'Sándwich del día', price: 25 },
            { name: 'Mix de frutos secos', price: 16 },
            { name: 'Galletas artesanales', price: 12 },
        ],
    },
];

export default function StoreIndex({
    products,
    categories,
    filters,
}: {
    products: Paginated<Product>;
    categories: { id: string; name: string; slug: string }[];
    filters: {
        search: string;
        category: string;
        minPrice: string;
        maxPrice: string;
    };
}) {
    const [search, setSearch] = useState(filters.search);
    const [category, setCategory] = useState(filters.category);
    const [menuFilter, setMenuFilter] = useState<string | null>(null);
    const [minPrice, setMinPrice] = useState(filters.minPrice);
    const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            store.index().url,
            { search, category, min_price: minPrice, max_price: maxPrice },
            { preserveState: true, replace: true },
        );
    };
    const goToProductCategory = (slug: string) => {
        const next = category === slug ? '' : slug;
        setCategory(next);
        router.get(
            store.index().url,
            {
                search,
                category: next,
                min_price: minPrice,
                max_price: maxPrice,
            },
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
    const goToMenuGroup = (title: string) => {
        setMenuFilter((current) => (current === title ? null : title));
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            <Head title={'Tienda'} />

            {/* Hero: merch destacado del evento */}
            <section
                className={
                    'border-b border-white/10 bg-black bg-[radial-gradient(circle_at_top_right,rgba(209,31,22,.28),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(124,25,22,.22),transparent_40%)] lg:min-h-[calc(100vh-4rem)]'
                }
            >
                <div
                    className={
                        'px-4 pt-4 pb-10 sm:px-6 lg:flex lg:items-stretch lg:gap-4 lg:pt-2 lg:pr-0 lg:pl-16'
                    }
                >
                    <div
                        className={
                            'lg:flex lg:w-fit lg:shrink-0 lg:flex-col lg:items-start'
                        }
                    >
                        <p
                            className={
                                'text-xs font-bold tracking-[.3em] whitespace-nowrap text-brand-light uppercase'
                            }
                        >
                            Tienda oficial
                        </p>
                        <h1
                            className={
                                'mt-2 font-display text-4xl leading-[0.95] sm:text-7xl lg:mt-auto lg:rotate-180 lg:text-[10rem] lg:whitespace-nowrap lg:[writing-mode:vertical-rl]'
                            }
                        >
                            Llévate un <br className={'hidden lg:block'} />
                            recuerdo.
                        </h1>
                    </div>

                    <div className={'relative mt-8 flex-1 lg:mt-0'}>
                        <img
                            src={'/images/store/hero-merch.png'}
                            alt={'Merch oficial del evento'}
                            className={
                                'aspect-16/10 w-full object-cover lg:aspect-auto lg:h-[780px]'
                            }
                        />

                        <div
                            className={
                                'relative -mt-14 ml-auto max-w-md bg-brand-dark px-8 py-12 shadow-xl shadow-black/30 sm:absolute sm:right-48 sm:bottom-0 sm:mt-0 sm:translate-y-1/2'
                            }
                        >
                            <p className={'leading-6 text-white/90'}>
                                Merch exclusivo del evento para llevarte un
                                pedacito de la experiencia.
                            </p>
                            <Button
                                asChild
                                variant={'outline'}
                                className={
                                    'mt-5 rounded-none border-white/40 bg-transparent text-white hover:bg-white/10'
                                }
                            >
                                <a href={'#catalogo'}>
                                    Ver catálogo
                                    <ArrowDown className={'size-4'} />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Banner: pedidos de comida/bebida para retirar en el recinto */}
            <section
                className={
                    'relative overflow-hidden border-b border-white/10 bg-black lg:min-h-[calc(100vh-4rem)]'
                }
            >
                <img
                    src={'/images/store/cafe5.avif'}
                    alt={'Pide tu café o snack antes de llegar'}
                    className={
                        'absolute inset-x-0 top-0 h-[80vh] w-full object-cover'
                    }
                />
                <div
                    className={
                        'relative flex min-h-[420px] flex-col justify-end px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-4rem)] lg:pr-6 lg:pl-16'
                    }
                >
                    <h2
                        className={
                            'ml-auto max-w-3xl text-right font-display text-5xl leading-[0.9] sm:text-7xl lg:text-9xl'
                        }
                    >
                        Pide antes
                        <br />
                        de llegar
                    </h2>
                    <div
                        className={
                            'mt-8 max-w-md bg-brand-dark px-8 py-12 shadow-xl shadow-black/30 lg:ml-24'
                        }
                    >
                        <p className={'leading-6 text-white/90'}>
                            Encuentra tu café, bebida o snack listo en el punto
                            de retiro del recinto.
                        </p>
                        <Button
                            asChild
                            variant={'outline'}
                            className={
                                'mt-5 rounded-none border-white/40 bg-transparent text-white hover:bg-white/10'
                            }
                        >
                            <a href={'#menu'}>
                                Ver menú
                                <ArrowDown className={'size-4'} />
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Catálogo */}
            <section
                id={'catalogo'}
                className={'mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6'}
            >
                <h2 className={'text-2xl font-black sm:text-3xl'}>Catálogo</h2>

                <h3
                    className={
                        'mt-6 text-xs font-bold tracking-[.25em] text-brand-light uppercase'
                    }
                >
                    Categorías
                </h3>
                <div
                    className={
                        'mt-4 flex snap-x [scrollbar-width:none] gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden'
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
                            {/*
                                Foto representativa de la categoría.
                                Reemplazar este bloque placeholder por:
                                <img src={item.image_url} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                            */}
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
                    <Input
                        type={'number'}
                        min={'0'}
                        step={'0.01'}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder={'Precio min.'}
                        className={'h-14 border-white/10 bg-zinc-900 sm:w-32'}
                    />
                    <Input
                        type={'number'}
                        min={'0'}
                        step={'0.01'}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder={'Precio max.'}
                        className={'h-14 border-white/10 bg-zinc-900 sm:w-32'}
                    />
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
                    {products.data.map((product) => (
                        <Link
                            key={product.id}
                            href={store.show(product.slug)}
                            className={
                                'group overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] transition hover:-translate-y-1 hover:border-brand/50'
                            }
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
                                <h3 className={'mt-2 text-xl font-black'}>
                                    {product.name}
                                </h3>
                                <div
                                    className={
                                        'mt-5 flex items-center justify-between'
                                    }
                                >
                                    <strong className={'text-brand-light'}>
                                        Desde{' '}
                                        {money(
                                            product.variants[0]?.sale_price ??
                                                0,
                                        )}
                                    </strong>
                                    <span className={'text-xs text-zinc-500'}>
                                        {product.variants.reduce(
                                            (sum, item) =>
                                                sum +
                                                (item.inventory
                                                    ?.available_quantity ?? 0),
                                            0,
                                        )}{' '}
                                        disp.
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {products.data.length === 0 && (
                    <div
                        className={
                            'mt-8 rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-400'
                        }
                    >
                        <PackageSearch className={'mx-auto mb-4'} />
                        No hay productos para estos filtros.
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

            {/* Menú: café y snacks para pedir antes de llegar */}
            <section
                id={'menu'}
                className={'scroll-mt-20 border-t border-white/10 bg-black'}
            >
                <div className={'mx-auto max-w-7xl px-4 py-14 sm:px-6'}>
                    <div className={'flex items-center justify-between gap-4'}>
                        <h2 className={'text-2xl font-black sm:text-3xl'}>
                            Menú
                        </h2>
                        {menuFilter && (
                            <button
                                type={'button'}
                                onClick={() => setMenuFilter(null)}
                                className={
                                    'text-xs font-bold text-zinc-400 uppercase hover:text-white'
                                }
                            >
                                Ver todo
                            </button>
                        )}
                    </div>
                    <p className={'mt-2 max-w-xl text-sm text-zinc-400'}>
                        Pide tu café o snack antes de llegar y retíralo en el
                        punto de retiro del recinto.
                    </p>

                    <h3
                        className={
                            'mt-6 text-xs font-bold tracking-[.25em] text-brand-light uppercase'
                        }
                    >
                        Categorías
                    </h3>
                    <div
                        className={
                            'mt-4 flex snap-x [scrollbar-width:none] gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden'
                        }
                    >
                        {MENU.map((group) => (
                            <button
                                key={`menu-${group.title}`}
                                type={'button'}
                                onClick={() => goToMenuGroup(group.title)}
                                className={
                                    'group relative aspect-4/3 w-56 shrink-0 snap-start overflow-hidden border transition sm:w-72 ' +
                                    (menuFilter === group.title
                                        ? 'border-brand'
                                        : 'border-white/10 hover:border-brand/50')
                                }
                            >
                                <div
                                    className={
                                        'absolute inset-0 bg-gradient-to-br from-brand-dark/40 to-zinc-900'
                                    }
                                />
                                <ImageIcon
                                    className={
                                        'absolute inset-0 m-auto size-12 text-white/25 transition group-hover:scale-110'
                                    }
                                    aria-hidden={'true'}
                                />
                                <span
                                    className={
                                        'absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3 text-left text-base font-bold text-white'
                                    }
                                >
                                    {group.title}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div
                        className={
                            'mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2'
                        }
                    >
                        {MENU.filter(
                            (group) =>
                                !menuFilter || group.title === menuFilter,
                        ).map((group) => (
                            <div key={group.title}>
                                <h3
                                    className={
                                        'text-xs font-bold tracking-[.25em] text-brand-light uppercase'
                                    }
                                >
                                    {group.title}
                                </h3>
                                <ul className={'mt-4 divide-y divide-white/10'}>
                                    {group.items.map((item) => (
                                        <li
                                            key={item.name}
                                            className={
                                                'flex items-center justify-between gap-4 py-3'
                                            }
                                        >
                                            <span>{item.name}</span>
                                            <strong
                                                className={
                                                    'shrink-0 text-brand-light'
                                                }
                                            >
                                                {money(item.price)}
                                            </strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
