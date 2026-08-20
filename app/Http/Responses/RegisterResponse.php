<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Models\User;
use App\Support\AuthenticatedDestination;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

final class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        return redirect()->route(AuthenticatedDestination::routeFor($user));
    }
}
