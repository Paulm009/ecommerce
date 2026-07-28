<?php

declare(strict_types=1);

use App\Models\LayoutTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('loads the actual layout template for an event being edited', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $layout = LayoutTemplate::query()->where('name', 'Mesas y boxes')->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.events.index', ['search' => 'Cena de Gala EVENTA']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->where('events.data.0.name', 'Cena de Gala EVENTA')
            ->where('events.data.0.occurrences.0.layout.layout_template_id', $layout->id),
        );
});
