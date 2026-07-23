<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Actions\Orders\CreateProductOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\CreateProductOrderRequest;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;

final class ProductCheckoutController extends Controller
{
    public function store(CreateProductOrderRequest $request, CurrentCompany $currentCompany, CreateProductOrder $createProductOrder): RedirectResponse
    {
        $data = $request->validated();
        $paymentAttempt = $createProductOrder->handle($currentCompany->get(), $data, $request->user()?->id, $data['session_token'] ?? null);

        return to_route('payments.show', $paymentAttempt);
    }
}
