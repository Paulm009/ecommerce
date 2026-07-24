<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

final class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->firstOrFail();
        $permissions = [
            ['events.manage', 'tickets', 'Administrar eventos y funciones'],
            ['layouts.manage', 'tickets', 'Administrar plantillas de planos'],
            ['tickets.issue', 'tickets', 'Emitir entradas con venta'],
            ['tickets.issue_courtesy', 'tickets', 'Emitir entradas de cortesía'],
            ['tickets.void', 'tickets', 'Anular entradas'],
            ['tickets.view', 'tickets', 'Consultar entradas'],
            ['access.scan', 'tickets', 'Validar entradas en accesos'],
            ['products.manage', 'commerce', 'Administrar catálogo de productos'],
            ['inventory.view', 'commerce', 'Consultar inventario'],
            ['inventory.adjust', 'commerce', 'Ajustar inventario'],
            ['orders.manage', 'commerce', 'Administrar pedidos web'],
            ['pos.sell', 'pos', 'Registrar ventas POS'],
            ['cash.manage', 'pos', 'Abrir, mover y cerrar caja'],
            ['dashboard.view', 'global', 'Consultar indicadores'],
            ['payments.review_incidents', 'global', 'Revisar incidencias de pago'],
            ['users.manage', 'global', 'Administrar usuarios internos'],
            ['settings.manage', 'global', 'Administrar configuración de empresa'],
        ];

        foreach ($permissions as [$code, $module, $description]) {
            Permission::query()->updateOrCreate(['code' => $code], compact('module', 'description'));
        }

        $roles = [
            'global_admin' => ['Administrador global', 'global', Permission::query()->pluck('code')->all()],
            'ticket_admin' => ['Administrador de boletería', 'tickets', ['dashboard.view', 'events.manage', 'layouts.manage', 'tickets.issue', 'tickets.issue_courtesy', 'tickets.void', 'tickets.view', 'access.scan', 'payments.review_incidents']],
            'ticket_seller' => ['Boletero', 'tickets', ['tickets.issue', 'tickets.issue_courtesy', 'tickets.view']],
            'ticket_scanner' => ['Control de acceso', 'tickets', ['access.scan']],
            'pos_admin' => ['Administrador de comercio', 'pos', ['dashboard.view', 'products.manage', 'inventory.view', 'inventory.adjust', 'orders.manage', 'pos.sell', 'cash.manage']],
            'pos_seller' => ['Vendedor POS', 'pos', ['pos.sell']],
        ];

        foreach ($roles as $code => [$name, $module, $codes]) {
            $role = Role::query()->updateOrCreate(
                ['company_id' => $company->id, 'code' => $code],
                ['name' => $name, 'module' => $module, 'is_system' => true],
            );
            $role->permissions()->sync(Permission::query()->whereIn('code', $codes)->pluck('id'));
        }
    }
}
