import { Head, Link, router } from '@inertiajs/react';
import { PackageSearch, Search, ShoppingBag } from 'lucide-react';
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

    return (
        <>
            <Head title={'Tienda'} />
            <section
                className={
                    'border-b border-white/10 bg-gradient-to-r from-cyan-500/15 to-fuchsia-500/10'
                }
            >
                <div className={'mx-auto max-w-7xl px-4 py-16 sm:px-6'}>
                    <p
                        className={
                            'text-sm font-bold tracking-[.25em] text-cyan-300 uppercase'
                        }
                    >
                        Tienda oficial
                    </p>
                    <h1 className={'mt-3 text-4xl font-black sm:text-6xl'}>
                        Llévate un recuerdo.
                    </h1>
                    <form
                        onSubmit={submit}
                        className={
                            'mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row'
                        }
                    >
                        <div className={'relative flex-1'}>
                            <Search
                                className={
                                    'absolute top-3 left-3 size-4 text-zinc-500'
                                }
                            />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={'Buscar productos'}
                                className={'border-white/10 bg-zinc-900 pl-9'}
                            />
                        </div>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={
                                'h-9 rounded-md border border-white/10 bg-zinc-900 px-3 text-sm'
                            }
                        >
                            <option value={''}>Todas las categorías</option>
                            {categories.map((item) => (
                                <option key={item.id} value={item.slug}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <Input
                            type={'number'}
                            min={'0'}
                            step={'0.01'}
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder={'Precio min.'}
                            className={'border-white/10 bg-zinc-900 sm:w-32'}
                        />
                        <Input
                            type={'number'}
                            min={'0'}
                            step={'0.01'}
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder={'Precio max.'}
                            className={'border-white/10 bg-zinc-900 sm:w-32'}
                        />
                        <Button
                            className={
                                'bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                            }
                        >
                            Buscar
                        </Button>
                    </form>
                </div>
            </section>
            <section className={'mx-auto max-w-7xl px-4 py-12 sm:px-6'}>
                <div
                    className={
                        'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }
                >
                    {products.data.map((product, index) => (
                        <Link
                            key={product.id}
                            href={store.show(product.slug)}
                            className={
                                'group overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] transition hover:-translate-y-1'
                            }
                        >
                            <div
                                className={`grid aspect-square place-items-center bg-gradient-to-br ${index % 2 ? 'from-cyan-500/60 to-blue-700' : 'from-fuchsia-600/60 to-orange-500'}`}
                            >
                                <ShoppingBag
                                    className={
                                        'size-20 text-white/80 transition group-hover:scale-110'
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
                                <h2 className={'mt-2 text-xl font-black'}>
                                    {product.name}
                                </h2>
                                <div
                                    className={
                                        'mt-5 flex items-center justify-between'
                                    }
                                >
                                    <strong className={'text-cyan-300'}>
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
                            'rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-400'
                        }
                    >
                        <PackageSearch className={'mx-auto mb-4'} />
                        No hay productos para estos filtros.
                    </div>
                )}
            </section>
        </>
    );
}
