<?php

declare(strict_types=1);

namespace App\Http\Controllers\Operations;

use App\Actions\Pos\CreatePosSale;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pos\CreatePosSaleRequest;
use App\Models\CashSession;
use App\Models\ProductVariant;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class PosController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        return Inertia::render('operations/pos/index', [
            'variants' => ProductVariant::query()
                ->select(['id', 'product_id', 'name', 'sku', 'barcode', 'sale_price'])
                ->with(['product:id,name,status', 'inventory'])
                ->where('is_active', true)
                ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->whereLike('sku', '%'.$search.'%')->orWhereLike('barcode', '%'.$search.'%')))
                ->latest()
                ->limit(80)
                ->get(),
            'cashSession' => CashSession::query()->where('status', 'open')->latest('opened_at')->first(),
            'filters' => compact('search'),
        ]);
    }

    public function store(CreatePosSaleRequest $request, CurrentCompany $currentCompany, CreatePosSale $createPosSale): RedirectResponse
    {
        $data = $request->validated();
        $payment = $createPosSale->handle($currentCompany->get(), CashSession::query()->findOrFail($data['cash_session_id']), $request->user(), $data['items']);

        return to_route('payments.show', $payment);
    }
}
