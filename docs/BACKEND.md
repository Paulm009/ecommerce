# Backend Laravel

## General conventions

- Follow the installed version API and conventions.
- Use Laravel Boost to query documentation compatible with project packages.
- Keep controllers small.
- Use route model binding.
- Authorize on the server.
- Validate via Form Requests when validation is non-trivial.
- Use actions for operations with multiple rules, models, or effects.
- Avoid generic repositories on top of Eloquent.
- Avoid DTOs if a validated array or model correctly expresses the operation.
- Do not use `env()` outside config files.
- Do not write financial or stock logic with `float`.

## Controllers

A controller should:

1. receive dependencies;
2. authorize or work with an already-authorized request;
3. obtain or execute the operation;
4. return `Response`, `RedirectResponse`, or a concrete HTTP response.

It should not:

- contain extensive business rules;
- open transactions with multiple hard-to-test branches;
- manually transform large repeated structures;
- execute unrelated queries;
- call other controllers.

### Read controller

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProductIndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $search = $request->string('search')->toString();

        $products = Product::query()
            ->with('category:id,name')
            ->when(
                $search !== '',
                fn ($query) => $query->whereLike('name', "%{$search}%"),
            )
            ->latest()
            ->paginate()
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => compact('search'),
        ]);
    }
}
```

### Write controller

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Products;

use App\Actions\Products\CreateProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use Illuminate\Http\RedirectResponse;

final class ProductStoreController extends Controller
{
    public function __invoke(
        StoreProductRequest $request,
        CreateProduct $createProduct,
    ): RedirectResponse {
        $product = $createProduct->handle($request->validated());

        return to_route('products.show', $product)
            ->with('success', 'Product created successfully.');
    }
}
```

## Form Requests

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Products;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('is_active', true),
            ],
            'price' => ['required', 'integer', 'min:0'],
        ];
    }
}
```

## Actions

An action represents a business operation, not a generic layer.

```php
<?php

declare(strict_types=1);

namespace App\Actions\Products;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

final class CreateProduct
{
    public function handle(array $data): Product
    {
        return DB::transaction(function () use ($data): Product {
            return Product::query()->create($data);
        });
    }
}
```

Use verbal names: `CreateProduct`, `ReserveInventory`, `ConfirmPayment`,
`CloseCashRegister`.

## Authorization

- Policy for resources.
- Gate for global capabilities.
- Form Request may call Policy.
- A page must not receive records the user cannot see.
- Hiding a button does not replace authorization.

## Eloquent

- Declare casts.
- Use scopes for reusable filters.
- Eager-load needed relationships explicitly.
- Select columns when a relationship is heavy.
- Avoid accessors with queries.
- Avoid model events for hard-to-trace critical operations.
- Use enum or value object when a state has real rules.

## Transactions & idempotency

- Keep the transaction short.
- Do not wait for an external API inside the transaction.
- Use an idempotency key or unique external reference.
- Record the result before firing retryable effects.
- For stock and seating, use appropriate constraints and locking.
- Jobs must be safe to execute more than once without duplicating the result.

## Responses

- Reads: `Inertia::render`.
- Writes: redirect to a stable route with flash message.
- Validation errors: standard Laravel/Inertia behavior.
- Standalone actions: JSON response only when the flow truly requires it.
- Do not mix HTML, JSON, and Inertia for the same operation without a clear reason.
