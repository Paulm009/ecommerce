<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

final class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->firstOrFail();
        $accounts = [
            ['Super Admin', 'admin@example.com', 'global_admin'],
            ['Administradora de Tickets', 'tickets@example.com', 'ticket_admin'],
            ['Boletero Principal', 'boletero@example.com', 'ticket_seller'],
            ['Control de Acceso', 'escaneador@example.com', 'ticket_scanner'],
            ['Administradora POS', 'posadmin@example.com', 'pos_admin'],
            ['Vendedor de Tienda', 'vendedor@example.com', 'pos_seller'],
        ];
        $admin = null;

        foreach ($accounts as [$name, $email, $roleCode]) {
            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'company_id' => $company->id,
                    'name' => $name,
                    'phone' => '+591 70000000',
                    'password' => 'password',
                    'user_type' => 'staff',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ],
            );
            $role = Role::query()->where('company_id', $company->id)->where('code', $roleCode)->firstOrFail();
            $user->roles()->sync([$role->id => ['assigned_by_user_id' => $admin?->id, 'assigned_at' => now()]]);
            $admin ??= $user;
        }

        $customerUser = User::query()->updateOrCreate(
            ['email' => 'cliente@example.com'],
            ['name' => 'Cliente Demo', 'phone' => '+591 71234567', 'password' => 'password', 'user_type' => 'customer', 'status' => 'active', 'email_verified_at' => now()],
        );
        Customer::query()->updateOrCreate(
            ['user_id' => $customerUser->id],
            ['full_name' => $customerUser->name, 'email' => $customerUser->email, 'phone' => $customerUser->phone, 'identity_document' => 'CI-DEMO-001'],
        );
    }
}
