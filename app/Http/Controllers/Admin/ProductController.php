<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Products\CreateProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProductController extends Controller
{
    public function index(Request $request, CurrentCompany $currentCompany): Response
    {
        $search = $request->string('search')->trim()->toString();
        $products = Product::query()
            ->with(['categories:id,name', 'variants' => fn ($query) => $query->with('inventory')])
            ->where('company_id', $currentCompany->get()->id)
            ->when($search !== '', fn ($query) => $query->whereLike('name', '%'.$search.'%'))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'categories' => ProductCategory::query()->where('company_id', $currentCompany->get()->id)->where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'filters' => compact('search'),
        ]);
    }

    public function store(StoreProductRequest $request, CurrentCompany $currentCompany, CreateProduct $createProduct): RedirectResponse
    {
        $createProduct->handle($currentCompany->get(), $request->validated(), $request->user());

        return to_route('admin.products.index')->with('success', 'Producto creado.');
    }

    public function toggle(Product $product, Request $request): RedirectResponse
    {
        $request->validate(['status' => ['required', 'in:draft,published,inactive']]);
        $product->update([
            'status' => $request->string('status')->toString(),
            'published_at' => $request->input('status') === 'published' ? ($product->published_at ?? now()) : $product->published_at,
            'updated_by_user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Estado actualizado.');
    }
}
