<?php

declare(strict_types=1);

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('shows published events while their sales window is still open', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $category = EventCategory::query()->where('is_active', true)->firstOrFail();
    $layout = LayoutTemplate::query()->where('status', 'active')->firstOrFail();
    $eventName = 'Evento con venta abierta';

    $this->actingAs($admin)
        ->post(route('admin.events.store'), [
            'name' => $eventName,
            'event_category_id' => $category->id,
            'layout_template_id' => $layout->id,
            'short_description' => 'Debe seguir visible en venta de entradas.',
            'description' => 'Prueba de ventana de ventas.',
            'venue_name' => 'Teatro Central',
            'venue_address' => 'Av. Principal 123',
            'city' => 'La Paz',
            'starts_at' => now()->subHour()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addHours(3)->format('Y-m-d\TH:i'),
            'sales_start_at' => now()->subDay()->format('Y-m-d\TH:i'),
            'sales_end_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'status' => 'published',
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', $eventName)->firstOrFail();

    $this->get(route('events.index', ['search' => $eventName]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('events/index')
            ->where('events.data.0.name', $eventName),
        );

    $this->get(route('events.show', $event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('events/show')
            ->where('event.name', $eventName),
        );
});
