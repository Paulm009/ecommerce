<?php

declare(strict_types=1);

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('normalizes sales dates when editing an event', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $category = EventCategory::query()->where('is_active', true)->firstOrFail();
    $layout = LayoutTemplate::query()->where('status', 'active')->firstOrFail();
    $eventName = 'Evento con ventana de ventas';

    $this->actingAs($admin)
        ->post(route('admin.events.store'), [
            'name' => $eventName,
            'event_category_id' => $category->id,
            'layout_template_id' => $layout->id,
            'short_description' => 'Prueba de actualización de ventana de ventas.',
            'description' => 'Descripción de prueba.',
            'venue_name' => 'Teatro Central',
            'venue_address' => 'Av. Principal 123',
            'city' => 'La Paz',
            'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addWeek()->addHours(3)->format('Y-m-d\TH:i'),
            'sales_start_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'sales_end_at' => now()->addDays(2)->format('Y-m-d\TH:i'),
            'status' => 'published',
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', $eventName)->firstOrFail();

    $this->actingAs($admin)
        ->patch(route('admin.events.update', $event), [
            '_method' => 'PATCH',
            'name' => $eventName.' editado',
            'event_category_id' => $category->id,
            'short_description' => 'Prueba actualizada.',
            'description' => 'Descripción actualizada.',
            'venue_name' => 'Teatro Central',
            'venue_address' => 'Av. Principal 123',
            'city' => 'La Paz',
            'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addWeek()->addHours(3)->format('Y-m-d\TH:i'),
            'sales_start_at' => now()->addDays(2)->format('Y-m-d\TH:i'),
            'sales_end_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'status' => 'published',
        ])
        ->assertRedirect();

    $event->refresh();
    $occurrence = $event->occurrences()->firstOrFail();

    expect($event->name)->toBe($eventName.' editado')
        ->and($occurrence->sales_start_at->lessThanOrEqualTo($occurrence->sales_end_at))->toBeTrue();
});
