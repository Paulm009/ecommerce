import { Head, router, useForm } from '@inertiajs/react';
import { PackagePlus, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    FieldError,
    PageHeader,
    Pagination,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import productsRoutes from '@/routes/admin/products';

type Product = {
    id: string;
    name: string;
    status: string;
    product_type: string;
    categories: { name: string }[];
    variants: {
        id: string;
        name: string | null;
        sku: string;
        sale_price: string;
        inventory: {
            on_hand_quantity: number;
            reserved_quantity: number;
            available_quantity: number;
        } | null;
    }[];
};

export default function AdminProducts({
    products,
    categories,
    filters,
}: {
    products: Paginated<Product>;
    categories: { id: string; name: string }[];
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const form = useForm({
        name: '',
        description: '',
        product_type: 'simple',
        status: 'published',
        is_featured: false,
        hide_when_out_of_stock: true,
        category_ids: categories[0] ? [categories[0].id] : [],
        variants: [
            {
                name: 'Única',
                sku: '',
                barcode: '',
                sale_price: '50.00',
                purchase_cost: '20.00',
                stock: 20,
                low_stock_threshold: 5,
            },
        ],
    });
    const updateVariant = (
        index: number,
        changes: Partial<(typeof form.data.variants)[number]>,
    ) =>
        form.setData(
            'variants',
            form.data.variants.map((variant, variantIndex) =>
                variantIndex === index ? { ...variant, ...changes } : variant,
            ),
        );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(productsRoutes.store().url, {
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title={'Productos'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Catálogo'}
                    title={'Productos'}
                    description={
                        'Administra variantes, precios y stock inicial.'
                    }
                />
                <div className={'grid gap-6 xl:grid-cols-[1fr_420px]'}>
                    <Panel>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(
                                    productsRoutes.index().url,
                                    { search },
                                    { preserveState: true },
                                );
                            }}
                            className={'mb-5 flex gap-2'}
                        >
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={'Nombre o SKU'}
                            />
                            <Button variant={'outline'}>
                                <Search />
                            </Button>
                        </form>
                        <div className={'space-y-3'}>
                            {products.data.map((product) => (
                                <div
                                    key={product.id}
                                    className={'rounded-lg border p-4'}
                                >
                                    <div
                                        className={
                                            'flex flex-wrap items-start justify-between gap-3'
                                        }
                                    >
                                        <div>
                                            <strong>{product.name}</strong>
                                            <p
                                                className={
                                                    'text-xs text-muted-foreground'
                                                }
                                            >
                                                {product.categories
                                                    .map((item) => item.name)
                                                    .join(', ')}{' '}
                                                · {product.product_type}
                                            </p>
                                        </div>
                                        <div className={'flex gap-2'}>
                                            <StateBadge
                                                status={product.status}
                                            />
                                            <Button
                                                size={'sm'}
                                                variant={'outline'}
                                                onClick={() =>
                                                    router.patch(
                                                        productsRoutes.toggle(
                                                            product.id,
                                                        ).url,
                                                        {
                                                            status:
                                                                product.status ===
                                                                'published'
                                                                    ? 'inactive'
                                                                    : 'published',
                                                        },
                                                    )
                                                }
                                            >
                                                {product.status === 'published'
                                                    ? 'Desactivar'
                                                    : 'Publicar'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div
                                        className={
                                            'mt-4 grid gap-2 sm:grid-cols-2'
                                        }
                                    >
                                        {product.variants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                className={
                                                    'rounded-md bg-muted p-3 text-sm'
                                                }
                                            >
                                                <span>
                                                    {variant.name} ·{' '}
                                                    {variant.sku}
                                                </span>
                                                <strong
                                                    className={'float-right'}
                                                >
                                                    {money(variant.sale_price)}
                                                </strong>
                                                <p
                                                    className={
                                                        'mt-1 text-xs text-muted-foreground'
                                                    }
                                                >
                                                    Disponible:{' '}
                                                    {variant.inventory
                                                        ?.available_quantity ??
                                                        0}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination page={products} />
                    </Panel>
                    <Panel title={'Nuevo producto'}>
                        <form onSubmit={submit} className={'space-y-4'}>
                            <div>
                                <Label>Nombre</Label>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                />
                                <FieldError message={form.errors.name} />
                            </div>
                            <div>
                                <Label>Descripción</Label>
                                <Textarea
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label>Categoría</Label>
                                <select
                                    className={
                                        'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                    }
                                    value={form.data.category_ids[0] ?? ''}
                                    onChange={(e) =>
                                        form.setData('category_ids', [
                                            e.target.value,
                                        ])
                                    }
                                >
                                    {categories.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Tipo de producto</Label>
                                <select
                                    className={
                                        'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                    }
                                    value={form.data.product_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'product_type',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value={'simple'}>Simple</option>
                                    <option value={'variant'}>
                                        Con variantes
                                    </option>
                                </select>
                            </div>
                            <div className={'rounded-lg border p-4'}>
                                <div
                                    className={
                                        'mb-3 flex items-center justify-between'
                                    }
                                >
                                    <p className={'text-sm font-bold'}>
                                        Variantes
                                    </p>
                                    <Button
                                        type={'button'}
                                        size={'sm'}
                                        variant={'outline'}
                                        onClick={() => {
                                            form.setData(
                                                'product_type',
                                                'variant',
                                            );
                                            form.setData('variants', [
                                                ...form.data.variants,
                                                {
                                                    name: '',
                                                    sku: '',
                                                    barcode: '',
                                                    sale_price: '50.00',
                                                    purchase_cost: '20.00',
                                                    stock: 20,
                                                    low_stock_threshold: 5,
                                                },
                                            ]);
                                        }}
                                    >
                                        <Plus /> Agregar
                                    </Button>
                                </div>
                                <div className={'space-y-4'}>
                                    {form.data.variants.map(
                                        (variant, index) => (
                                            <div
                                                key={index}
                                                className={
                                                    'rounded-lg border p-3'
                                                }
                                            >
                                                <div
                                                    className={
                                                        'mb-3 flex justify-between text-xs font-bold text-muted-foreground'
                                                    }
                                                >
                                                    <span>
                                                        Variante {index + 1}
                                                    </span>
                                                    {form.data.variants.length >
                                                        1 && (
                                                        <button
                                                            type={'button'}
                                                            onClick={() =>
                                                                form.setData(
                                                                    'variants',
                                                                    form.data.variants.filter(
                                                                        (
                                                                            _,
                                                                            variantIndex,
                                                                        ) =>
                                                                            variantIndex !==
                                                                            index,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <Trash2
                                                                className={
                                                                    'size-4'
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                                <div
                                                    className={
                                                        'grid grid-cols-2 gap-3'
                                                    }
                                                >
                                                    <Input
                                                        placeholder={'Nombre'}
                                                        value={variant.name}
                                                        onChange={(event) =>
                                                            updateVariant(
                                                                index,
                                                                {
                                                                    name: event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    <Input
                                                        placeholder={'SKU'}
                                                        value={variant.sku}
                                                        onChange={(event) =>
                                                            updateVariant(
                                                                index,
                                                                {
                                                                    sku: event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    <Input
                                                        type={'number'}
                                                        step={'0.01'}
                                                        placeholder={'Precio'}
                                                        value={
                                                            variant.sale_price
                                                        }
                                                        onChange={(event) =>
                                                            updateVariant(
                                                                index,
                                                                {
                                                                    sale_price:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    <Input
                                                        type={'number'}
                                                        step={'0.01'}
                                                        placeholder={'Costo'}
                                                        value={
                                                            variant.purchase_cost
                                                        }
                                                        onChange={(event) =>
                                                            updateVariant(
                                                                index,
                                                                {
                                                                    purchase_cost:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    <Input
                                                        type={'number'}
                                                        placeholder={'Stock'}
                                                        value={variant.stock}
                                                        onChange={(event) =>
                                                            updateVariant(
                                                                index,
                                                                {
                                                                    stock: Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                },
                                                            )
                                                        }
                                                    />
                                                    <Input
                                                        type={'number'}
                                                        placeholder={'Minimo'}
                                                        value={
                                                            variant.low_stock_threshold
                                                        }
                                                        onChange={(event) =>
                                                            updateVariant(
                                                                index,
                                                                {
                                                                    low_stock_threshold:
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                            <div className={'flex gap-5 text-sm'}>
                                <label className={'flex gap-2'}>
                                    <input
                                        type={'checkbox'}
                                        checked={form.data.is_featured}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_featured',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    Destacado
                                </label>
                                <label className={'flex gap-2'}>
                                    <input
                                        type={'checkbox'}
                                        checked={
                                            form.data.hide_when_out_of_stock
                                        }
                                        onChange={(e) =>
                                            form.setData(
                                                'hide_when_out_of_stock',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    Ocultar sin stock
                                </label>
                            </div>
                            {Object.values(form.errors).map((error) => (
                                <FieldError
                                    key={error as string}
                                    message={error as string}
                                />
                            ))}
                            <Button
                                className={'w-full'}
                                disabled={form.processing}
                            >
                                <PackagePlus />
                                Crear producto
                            </Button>
                        </form>
                    </Panel>
                </div>
            </div>
        </>
    );
}

AdminProducts.layout = {
    breadcrumbs: [{ title: 'Productos', href: productsRoutes.index() }],
};
