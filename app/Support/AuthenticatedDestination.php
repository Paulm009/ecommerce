<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;

final class AuthenticatedDestination
{
    /**
     * The route name an authenticated user should land on, based on their
     * user type and permissions. Used both after a successful login and
     * whenever an already-authenticated user is redirected away from a
     * guest-only page (like /login).
     */
    public static function routeFor(User $user): string
    {
        if ($user->user_type === 'customer') {
            return 'account';
        }

        if ($user->hasPermission('dashboard.view')) {
            return 'dashboard';
        }

        return match (true) {
            $user->hasPermission('pos.sell') => 'pos.index',
            $user->hasPermission('access.scan') => 'scanner.index',
            $user->hasPermission('tickets.issue_courtesy') => 'courtesies.index',
            $user->hasPermission('cash.manage') => 'cash.index',
            $user->hasPermission('tickets.view') => 'admin.tickets.index',
            $user->hasPermission('orders.manage') => 'admin.orders.index',
            $user->hasPermission('inventory.view') => 'admin.inventory.index',
            $user->hasPermission('events.manage') => 'admin.events.index',
            $user->hasPermission('products.manage') => 'admin.products.index',
            $user->hasPermission('users.manage') => 'admin.users.index',
            $user->hasPermission('payments.review_incidents') => 'admin.payments.index',
            $user->hasPermission('layouts.manage') => 'admin.layouts.index',
            default => 'account',
        };
    }
}
