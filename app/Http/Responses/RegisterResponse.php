<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Models\User;
use App\Support\AuthenticatedDestination;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

final class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        /** @var User $user */
        $user = $request->user();

        if ($request->wantsJson()) {
            return response()->json([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ], 201);
        }

        return redirect()->route(AuthenticatedDestination::routeFor($user));
    }
}
