<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

final class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        return redirect()->intended($this->homeFor($request));
    }

    private function homeFor(Request $request): string
    {
        $user = $request->user();

        return $user && $user->hasPermission('dashboard.view')
            ? route('dashboard')
            : route('store.index');
    }
}
