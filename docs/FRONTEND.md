# Frontend Inertia, React & TypeScript

## Structure

```text
resources/js/
├── components/
│   ├── ui/                 Base shadcn/ui components
│   ├── shared/             Cross-cutting application components
│   └── <feature>/          Feature-specific components
├── hooks/                  Reusable behavior
├── layouts/                Shells and layouts
├── lib/                    UI-less utilities
├── pages/                  Inertia pages
└── types/                  Shared types
```

Domain components are not stored in `components/ui`.

## Inertia page

A page:

- receives props from the server;
- composes layout and components;
- keeps little local logic;
- does not re-query data it already received;
- uses Wayfinder URLs and actions when they exist.

```tsx
import { Head } from '@inertiajs/react';

import { PageHeader } from '@/components/shared/page-header';
import { ProductTable } from '@/components/products/product-table';
import { AppLayout } from '@/layouts/app-layout';

interface Product {
    id: number;
    name: string;
    formattedPrice: string;
    status: 'active' | 'inactive';
}

interface ProductsPageProps {
    products: {
        data: Product[];
    };
    filters: {
        search: string;
    };
}

export default function ProductsIndex({
    products,
    filters,
}: ProductsPageProps) {
    return (
        <AppLayout>
            <Head title="Products" />

            <div className="space-y-6">
                <PageHeader
                    title="Products"
                    description="Manage the catalog and availability."
                />

                <ProductTable
                    products={products.data}
                    initialSearch={filters.search}
                />
            </div>
        </AppLayout>
    );
}
```

## Forms

- Use typed Inertia forms.
- Preserve server errors.
- Disable actions during processing.
- Do not duplicate business rules in React.
- Frontend validation improves UX, but Laravel decides final validity.

```tsx
import { Form } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductFormData {
    name: string;
    price: number;
}

export function ProductForm() {
    return (
        <Form<ProductFormData>
            action="/products"
            method="post"
            className="space-y-4"
        >
            {({ errors, processing }) => (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <Button type="submit" disabled={processing}>
                        Save product
                    </Button>
                </>
            )}
        </Form>
    );
}
```

When Wayfinder is available, the action should come from the generated route instead of a
handwritten URL.

## State

Use in this order:

1. Inertia props;
2. local state;
3. URL for filters and pagination;
4. reusable hook;
5. shared state only if multiple unrelated areas need it.

Do not add a global state library to solve a form or a page.

## HTTP requests

- Use Inertia visits and forms for navigation and mutations.
- Use Inertia 3's standalone HTTP capability for local interactions that should not
  replace the page.
- Do not introduce Axios if the application does not use it.
- Do not create a parallel API for convenience.

## Components

- Composition over generic wrappers.
- Small, specific props.
- Variants with a consistent utility.
- `cn()` for conditional classes.
- Do not alter a shadcn base component to solve a single case; compose a domain component.
- Modify the base component when the change should apply application-wide.

## Tables

Split when needed:

```text
pages/products/index.tsx
components/products/product-table.tsx
components/products/product-columns.tsx
components/products/product-filters.tsx
components/products/product-row-actions.tsx
```

Do not build a universal `DataTable` with dozens of options before real reuse exists.

## TypeScript

- No `any`.
- Use discriminated unions for states.
- Use `import type`.
- Types near the feature when not shared.
- Shared types in `resources/js/types`.
- Do not use assertions to silence poorly defined data.
- The props contract must match the Laravel response.

## Accessibility

- Visible labels.
- Accessible names for icon buttons.
- Initial focus and focus return in dialogs.
- Full keyboard navigation.
- Error messages associated with fields.
- Do not use color as the only signal.
- Respect reduced motion.

## Design

Every interface must follow [../DESIGN.md](../DESIGN.md).
