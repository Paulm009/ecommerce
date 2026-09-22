<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Support\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class StoreCatalogController extends Controller
{
    public function index(Request $request, CurrentCompany $currentCompany): Response
    {
        $company = $currentCompany->get();
        $search = $request->string('search')->trim()->toString();
        $category = $request->string('category')->toString();
        $minPrice = $request->string('min_price')->trim()->toString();
        $maxPrice = $request->string('max_price')->trim()->toString();

        $withRelations = fn ($query) => $query
            ->select(['id', 'name', 'slug', 'description', 'product_type', 'is_featured'])
            ->with(['variants' => fn ($variants) => $variants->select(['id', 'product_id', 'name', 'sku', 'sale_price', 'is_default'])->where('is_active', true)->with('inventory'), 'categories:id,name,slug'])
            ->where('company_id', $company->id)
            ->where('status', ProductStatus::Published)
            ->where(fn ($nested) => $nested
                ->where('hide_when_out_of_stock', false)
                ->orWhereHas('variants.inventory', fn ($inventory) => $inventory->where('available_quantity', '>', 0)));

        $products = $withRelations(Product::query())
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->whereLike('name', '%'.$search.'%')->orWhereLike('description', '%'.$search.'%')))
            ->when($category !== '', fn ($query) => $query->whereHas('categories', fn ($categories) => $categories->where('slug', $category)))
            ->when(is_numeric($minPrice), fn ($query) => $query->whereHas('variants', fn ($variants) => $variants->where('sale_price', '>=', $minPrice)))
            ->when(is_numeric($maxPrice), fn ($query) => $query->whereHas('variants', fn ($variants) => $variants->where('sale_price', '<=', $maxPrice)))
            ->orderByDesc('is_featured')
            ->latest('published_at')
            ->paginate(12)
            ->withQueryString();

        $featuredProducts = $withRelations(Product::query())
            ->where('is_featured', true)
            ->latest('published_at')
            ->take(10)
            ->get();

        return Inertia::render('store/index', [
            'products' => $products,
            'featuredProducts' => $featuredProducts,
            'categories' => ProductCategory::query()->where('company_id', $company->id)->where('is_visible', true)->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
            'filters' => compact('search', 'category', 'minPrice', 'maxPrice'),
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->status === ProductStatus::Published, 404);

        return Inertia::render('store/show', ['product' => $product->load(['variants.inventory', 'categories:id,name,slug'])]);
    }
}
