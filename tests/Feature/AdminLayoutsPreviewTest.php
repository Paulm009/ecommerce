<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('renders layouts with node data for the visual preview', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.layouts.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/layouts/index')
            ->has('layouts.data.0.template_type')
            ->has('layouts.data.0.nodes')
            ->has('layouts.data.0.nodes.0.geometry_json')
            ->has('layouts.data.0.nodes.0.parent_id')
            ->has('layouts.data.0.nodes.0.metadata_json')
            ->has('layouts.data.0.nodes.0.external_key'),
        );
});
