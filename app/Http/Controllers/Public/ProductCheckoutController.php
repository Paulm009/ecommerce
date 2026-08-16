<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Actions\Orders\CreateProductOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\CreateProductOrderRequest;
use App\Models\User;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

final class ProductCheckoutController extends Controller
{
    public function store(CreateProductOrderRequest $request, CurrentCompany $currentCompany, CreateProductOrder $createProductOrder): RedirectResponse
    {
        $data = $request->validated();
        $userId = $request->user()?->id;

        if ($request->user() === null) {
            $user = User::query()->create([
                'company_id' => $currentCompany->get()->id,
                'name' => $data['buyer_name'],
                'email' => $data['buyer_email'],
                'phone' => $data['buyer_phone'],
                'password' => $data['password'],
                'user_type' => 'customer',
                'email_verified_at' => now(),
            ]);
            Auth::login($user);
            $userId = $user->id;
        }

        $paymentAttempt = $createProductOrder->handle($currentCompany->get(), $data, $userId, $data['session_token'] ?? null);

        return to_route('payments.show', $paymentAttempt);
    }
}
