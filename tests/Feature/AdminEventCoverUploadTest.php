<?php

declare(strict_types=1);

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('stores an uploaded cover image for events', function (): void {
    Storage::fake('public');

    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $category = EventCategory::query()->where('is_active', true)->firstOrFail();
    $layout = LayoutTemplate::query()->where('status', 'active')->firstOrFail();
    $coverImage = UploadedFile::fake()->image('cover.jpg', 1600, 900);

    $this->actingAs($admin)
        ->post(route('admin.events.store'), [
            'name' => 'Evento con portada',
            'event_category_id' => $category->id,
            'layout_template_id' => $layout->id,
            'short_description' => 'Evento de prueba con imagen destacada.',
            'description' => 'Descripción de prueba.',
            'cover_image' => $coverImage,
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
                'base_price' => '120.00',
                'quota_total' => 100,
            ]],
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', 'Evento con portada')->firstOrFail();
    $media = MediaAsset::query()
        ->where('company_id', $event->company_id)
        ->where('original_name', 'cover.jpg')
        ->firstOrFail();

    $this->assertDatabaseHas('event_media', [
        'event_id' => $event->id,
        'media_asset_id' => $media->id,
        'media_role' => 'cover',
    ]);
    Storage::disk('public')->assertExists($media->path);

    expect($event->cover_image_url)->not->toBeEmpty();
});

it('updates an event and replaces its cover image', function (): void {
    Storage::fake('public');

    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $category = EventCategory::query()->where('is_active', true)->firstOrFail();
    $layout = LayoutTemplate::query()->where('status', 'active')->firstOrFail();
    $initialCover = UploadedFile::fake()->image('cover-initial.jpg', 1600, 900);

    $this->actingAs($admin)
        ->post(route('admin.events.store'), [
            'name' => 'Evento editable',
            'event_category_id' => $category->id,
            'layout_template_id' => $layout->id,
            'short_description' => 'Evento de prueba para edición.',
            'description' => 'Descripción inicial.',
            'cover_image' => $initialCover,
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
                'base_price' => '120.00',
                'quota_total' => 100,
            ]],
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', 'Evento editable')->firstOrFail();
    $ticketType = $event->occurrences()->with('ticketTypes')->firstOrFail()->ticketTypes->firstOrFail();
    $initialMedia = $event->coverMedia()->firstOrFail();
    $updatedCover = UploadedFile::fake()->image('cover-updated.jpg', 1600, 900);

    $this->actingAs($admin)
        ->post(route('admin.events.update', $event), [
            '_method' => 'PATCH',
            'name' => 'Evento editado',
            'event_category_id' => $category->id,
            'short_description' => 'Resumen actualizado.',
            'description' => 'Descripción actualizada.',
            'cover_image' => $updatedCover,
            'venue_name' => 'Nuevo recinto',
            'venue_address' => 'Av. Cambio 456',
            'city' => 'Santa Cruz',
            'starts_at' => now()->addWeek()->addDay()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addWeek()->addDay()->addHours(2)->format('Y-m-d\TH:i'),
            'sales_start_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'sales_end_at' => now()->addWeek()->addDay()->format('Y-m-d\TH:i'),
            'status' => 'draft',
            'ticket_types' => [[
                'id' => $ticketType->id,
                'name' => 'General',
                'code' => 'GENERAL',
                'base_price' => '120.00',
                'quota_total' => 100,
                'minimum_per_order' => 1,
                'maximum_per_order' => 4,
                'is_active' => true,
            ]],
        ])
        ->assertRedirect();

    $event->refresh();
    $updatedMedia = $event->coverMedia()->firstOrFail();

    $this->assertDatabaseHas('event_media', [
        'event_id' => $event->id,
        'media_asset_id' => $updatedMedia->id,
        'media_role' => 'cover',
    ]);
    $this->assertDatabaseMissing('media_assets', [
        'id' => $initialMedia->id,
    ]);
    Storage::disk('public')->assertMissing($initialMedia->path);
    Storage::disk('public')->assertExists($updatedMedia->path);

    expect($event->name)->toBe('Evento editado')
        ->and($event->venue_name)->toBe('Nuevo recinto')
        ->and($event->cover_image_url)->not->toBeEmpty();
});
