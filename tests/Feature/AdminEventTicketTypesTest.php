<?php

declare(strict_types=1);

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('loads and updates ticket types for admin events', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $category = EventCategory::query()->where('is_active', true)->firstOrFail();
    $layout = LayoutTemplate::query()->where('status', 'active')->firstOrFail();

    $this->actingAs($admin)
        ->post(route('admin.events.store'), [
            'name' => 'Evento con entradas editables',
            'event_category_id' => $category->id,
            'layout_template_id' => $layout->id,
            'short_description' => 'Evento para probar la edición de entradas.',
            'description' => 'Descripción de prueba.',
            'venue_name' => 'Teatro Central',
            'venue_address' => 'Av. Principal 123',
            'city' => 'La Paz',
            'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addWeek()->addHours(3)->format('Y-m-d\TH:i'),
            'sales_start_at' => now()->format('Y-m-d\TH:i'),
            'sales_end_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'status' => 'published',
            'ticket_types' => [[
                'name' => 'General',
                'code' => 'GENERAL',
                'description' => 'Acceso general.',
                'base_price' => '120.00',
                'quota_total' => 100,
                'minimum_per_order' => 1,
                'maximum_per_order' => 4,
                'sales_start_at' => now()->format('Y-m-d\TH:i'),
                'sales_end_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'is_active' => true,
            ]],
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', 'Evento con entradas editables')->firstOrFail();
    $ticketType = TicketType::query()->where('event_occurrence_id', $event->occurrences()->firstOrFail()->id)->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.events.index', ['search' => 'Evento con entradas editables']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->where('events.data.0.name', 'Evento con entradas editables')
            ->where('events.data.0.occurrences.0.ticket_types.0.name', 'General')
            ->where('events.data.0.occurrences.0.ticket_types.0.code', 'GENERAL'),
        );

    $this->actingAs($admin)
        ->patch(route('admin.events.update', $event), [
            '_method' => 'PATCH',
            'name' => 'Evento con entradas editables actualizado',
            'event_category_id' => $category->id,
            'short_description' => 'Resumen actualizado.',
            'description' => 'Descripción actualizada.',
            'venue_name' => 'Teatro Renovado',
            'venue_address' => 'Av. Cambio 456',
            'city' => 'Santa Cruz',
            'starts_at' => now()->addWeek()->addDay()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addWeek()->addDay()->addHours(3)->format('Y-m-d\TH:i'),
            'sales_start_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'sales_end_at' => now()->addWeek()->addDay()->format('Y-m-d\TH:i'),
            'status' => 'published',
            'ticket_types' => [[
                'id' => $ticketType->id,
                'name' => 'General VIP',
                'code' => 'GENERAL',
                'description' => 'Acceso general mejorado.',
                'base_price' => '150.00',
                'quota_total' => 150,
                'minimum_per_order' => 2,
                'maximum_per_order' => 6,
                'sales_start_at' => now()->addDay()->format('Y-m-d\TH:i'),
                'sales_end_at' => now()->addWeek()->addDay()->format('Y-m-d\TH:i'),
                'is_active' => true,
            ]],
        ])
        ->assertRedirect();

    $event->refresh();

    $this->actingAs($admin)
        ->patch(route('admin.events.status', $event), [
            'status' => 'cancelled',
        ])
        ->assertRedirect();

    $this->actingAs($admin)
        ->get(route('admin.events.index', ['search' => 'Evento con entradas editables actualizado']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->where('events.data.0.status', 'cancelled')
            ->where('events.data.0.occurrences.0.status', 'cancelled'),
        );

    $this->assertDatabaseHas('events', [
        'id' => $event->id,
        'name' => 'Evento con entradas editables actualizado',
        'status' => 'cancelled',
    ]);
    $this->assertDatabaseHas('ticket_types', [
        'id' => $ticketType->id,
        'name' => 'General VIP',
        'code' => 'GENERAL',
        'quota_total' => 150,
    ]);
    $this->assertDatabaseHas('event_occurrences', [
        'id' => $event->occurrences()->firstOrFail()->id,
        'capacity_snapshot' => 150,
    ]);
});
