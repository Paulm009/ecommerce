<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductOrder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();
        $orders = ProductOrder::query()
            ->with(['sale:id,total_amount,currency_code,status', 'items:id,product_order_id,product_name_snapshot,variant_name_snapshot,quantity,line_total'])
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->whereLike('order_number', '%'.$search.'%')->orWhereLike('buyer_name', '%'.$search.'%')->orWhereLike('buyer_email', '%'.$search.'%')->orWhereLike('buyer_phone', '%'.$search.'%')))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/orders/index', ['orders' => $orders, 'filters' => compact('search', 'status')]);
    }

    public function deliver(ProductOrder $productOrder, Request $request): RedirectResponse
    {
        abort_unless($productOrder->status->value === 'paid', 422);
        $productOrder->update(['status' => 'delivered', 'delivered_at' => now(), 'delivered_by_user_id' => $request->user()->id]);

        return back()->with('success', 'Pedido marcado como entregado.');
    }
}
