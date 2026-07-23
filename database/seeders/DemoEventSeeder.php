<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Events\CreateEvent;
use App\Models\Company;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventStaffAssignment;
use App\Models\LayoutTemplate;
use App\Models\PromotionCode;
use App\Models\User;
use Illuminate\Database\Seeder;

final class DemoEventSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->firstOrFail();
        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
        $categories = EventCategory::query()->where('company_id', $company->id)->pluck('id', 'slug');
        $layouts = LayoutTemplate::query()->where('company_id', $company->id)->pluck('id', 'name');
        $events = [
            ['Festival Fuego 2026', 'La noche más intensa del año', 'Música en vivo, gastronomía y una producción inmersiva en el escenario principal.', 'Arena EVENTA', 'Av. Costanera 100', 'Santa Cruz', 'musica', 'Campo general', now()->addDays(30), [['General', 'GENERAL', '140.00', 350], ['Campo VIP', 'VIP', '320.00', 100]], 'published'],
            ['Noche Sinfónica', 'Una orquesta, luces y cine bajo las estrellas', 'Concierto sinfónico con selección de bandas sonoras y acceso numerado.', 'Teatro Central', 'Calle Libertad 420', 'La Paz', 'musica', 'Teatro clásico', now()->addDays(45), [['Orquesta', 'ORQUESTA', '180.00', 120], ['Galería', 'GALERIA', '90.00', 80]], 'published'],
            ['Product Summit Bolivia', 'Ideas que se convierten en productos', 'Conferencias, talleres y networking para equipos digitales.', 'Centro de Convenciones', 'Av. América 900', 'Cochabamba', 'conferencias', 'Auditorio numerado', now()->addDays(60), [['Full day', 'FULL', '240.00', 160], ['Workshop', 'WORKSHOP', '390.00', 40]], 'published'],
            ['Cena de Gala EVENTA', 'Una experiencia de mesa completa', 'Música, cena y premiación en mesas compartidas y boxes privados.', 'Gran Salón', 'Av. San Martín 2100', 'Santa Cruz', 'teatro', 'Mesas y boxes', now()->addDays(75), [['Mesa Plata', 'PLATA', '220.00', 80], ['Mesa Oro', 'ORO', '380.00', 60]], 'published'],
            ['Experiencia Secreta', 'Próximamente', 'Evento en preparación para probar el ciclo de borrador.', 'Ubicación por anunciar', null, 'Santa Cruz', 'musica', 'Recinto mixto', now()->addDays(90), [['Preventa', 'PREVENTA', '100.00', 100]], 'draft'],
            ['Festival Archivo 2025', 'Edición histórica', 'Evento finalizado conservado para reportes y control de accesos.', 'Arena EVENTA', 'Av. Costanera 100', 'Santa Cruz', 'musica', 'Campo general', now()->subDays(20), [['General', 'GENERAL-2025', '100.00', 300]], 'published'],
        ];

        foreach ($events as [$name, $short, $description, $venue, $address, $city, $category, $layout, $startsAt, $ticketTypes, $status]) {
            $event = app(CreateEvent::class)->handle($company, [
                'name' => $name,
                'event_category_id' => $categories[$category],
                'layout_template_id' => $layouts[$layout],
                'short_description' => $short,
                'description' => $description,
                'venue_name' => $venue,
                'venue_address' => $address,
                'city' => $city,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addHours(5),
                'sales_start_at' => $startsAt->copy()->subMonths(3),
                'sales_end_at' => $startsAt->copy()->subHour(),
                'status' => $status,
                'ticket_types' => array_map(fn (array $ticket): array => ['name' => $ticket[0], 'code' => $ticket[1], 'base_price' => $ticket[2], 'quota_total' => $ticket[3]], $ticketTypes),
            ], $admin);

            if ($name === 'Festival Archivo 2025') {
                $event->update(['status' => 'finished']);
                $event->occurrences()->update(['status' => 'finished']);
            }
        }

        $featured = Event::query()->where('name', 'Festival Fuego 2026')->firstOrFail();
        PromotionCode::query()->create([
            'event_id' => $featured->id,
            'code' => 'FUEGO10',
            'discount_type' => 'percentage',
            'discount_value' => '10.00',
            'minimum_amount' => '100.00',
            'maximum_discount' => '50.00',
            'maximum_redemptions' => 100,
            'maximum_per_customer' => 1,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(20),
            'created_by_user_id' => $admin->id,
        ]);

        $occurrence = $featured->occurrences()->firstOrFail();
        foreach ([['tickets@example.com', 'event_admin'], ['boletero@example.com', 'ticket_office'], ['escaneador@example.com', 'scanner']] as [$email, $assignment]) {
            $user = User::query()->where('email', $email)->firstOrFail();
            EventStaffAssignment::query()->create([
                'event_occurrence_id' => $occurrence->id,
                'user_id' => $user->id,
                'assignment_type' => $assignment,
                'active_from' => now(),
                'active_until' => $occurrence->starts_at->copy()->addHours(8),
                'assigned_by_user_id' => $admin->id,
            ]);
        }
    }
}
