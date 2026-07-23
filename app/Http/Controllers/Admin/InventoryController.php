<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Inventory\AdjustInventory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\AdjustInventoryRequest;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockAlert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $variants = ProductVariant::query()
            ->select(['id', 'product_id', 'name', 'sku', 'sale_price', 'purchase_cost', 'low_stock_threshold'])
            ->with(['product:id,name', 'inventory'])
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->whereLike('sku', '%'.$search.'%')->orWhereIn('product_id', Product::query()->whereLike('name', '%'.$search.'%')->select('id'))))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/inventory/index', [
            'variants' => $variants,
            'filters' => compact('search'),
            'alerts' => StockAlert::query()->with('variant.product:id,name')->where('status', 'open')->latest('opened_at')->limit(20)->get(),
            'movements' => InventoryMovement::query()->with('variant.product:id,name')->latest()->limit(30)->get(),
        ]);
    }

    public function adjust(AdjustInventoryRequest $request, AdjustInventory $adjustInventory): RedirectResponse
    {
        $data = $request->validated();
        $adjustInventory->handle(ProductVariant::query()->findOrFail($data['product_variant_id']), $data['quantity_delta'], $data['reason'], $request->user(), $data['adjustment_type']);

        return back()->with('success', 'Inventario ajustado.');
    }
}
