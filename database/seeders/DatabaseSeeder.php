<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Company;
use App\Models\CompanySetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $company = Company::query()->firstOrCreate(
            ['tax_identifier' => '1029384756'],
            [
                'legal_name' => 'Eventa Commerce S.R.L.',
                'commercial_name' => 'EVENTA',
                'contact_email' => 'hola@eventa.test',
                'contact_phone' => '+591 70010010',
                'status' => 'active',
            ],
        );

        CompanySetting::query()->updateOrCreate(
            ['company_id' => $company->id],
            [
                'currency_code' => 'BOB',
                'timezone' => 'America/La_Paz',
                'temporary_selection_minutes' => 5,
                'payment_reservation_minutes' => 20,
                'sender_name' => 'EVENTA',
                'sender_email' => 'entradas@eventa.test',
                'support_email' => 'soporte@eventa.test',
                'support_phone' => '+591 70010011',
                'primary_color' => '#fbbf24',
                'secondary_color' => '#18181b',
                'settings_json' => ['environment' => 'demo', 'payment_provider' => 'demo_bank'],
            ],
        );

        $this->call([
            PermissionSeeder::class,
            DemoUsersSeeder::class,
            DemoCatalogSeeder::class,
            DemoEventSeeder::class,
            DemoFlowsSeeder::class,
        ]);
    }
}
