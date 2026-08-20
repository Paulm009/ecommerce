<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Models\User;
use App\Support\AuthenticatedDestination;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

final class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        return redirect()->intended(route(AuthenticatedDestination::routeFor($user)));
    }
}
