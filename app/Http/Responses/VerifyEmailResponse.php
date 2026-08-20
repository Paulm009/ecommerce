<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Models\User;
use App\Support\AuthenticatedDestination;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;

final class VerifyEmailResponse implements VerifyEmailResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        return redirect()->intended(route(AuthenticatedDestination::routeFor($user)).'?verified=1');
    }
}
