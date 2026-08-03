<?php

declare(strict_types=1);

use App\Models\Company;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\LayoutTemplateNode;
use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('builds ticket types from the selected layout when none are submitted', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $category = EventCategory::query()->where('is_active', true)->firstOrFail();
    $company = Company::query()->firstOrFail();
    $source = [
        'schema_version' => '2.0',
        'template_type' => 'sectors',
        'nodes' => [
            [
                'key' => 'gold',
                'label' => 'Gold',
                'type' => 'sector',
                'capacity' => 40,
                'selectable' => true,
                'sale_mode' => 'group',
                'geometry' => ['x' => 20, 'y' => 20, 'width' => 180, 'height' => 120],
                'metadata' => ['price' => '100.00'],
            ],
            [
                'key' => 'silver',
                'label' => 'Silver',
                'type' => 'sector',
                'capacity' => 80,
                'selectable' => true,
                'sale_mode' => 'group',
                'geometry' => ['x' => 240, 'y' => 20, 'width' => 180, 'height' => 120],
                'metadata' => ['price' => '60.00'],
            ],
        ],
    ];
    $encoded = json_encode($source, JSON_THROW_ON_ERROR);
    $media = MediaAsset::query()->create([
        'company_id' => $company->id,
        'disk' => 'local',
        'path' => 'demo/layouts/derived-ticket-types.json',
        'original_name' => 'derived-ticket-types.json',
        'mime_type' => 'application/json',
        'size_bytes' => strlen($encoded),
        'checksum_sha256' => hash('sha256', $encoded),
        'uploaded_by_user_id' => $admin->id,
    ]);
    $template = LayoutTemplate::query()->create([
        'company_id' => $company->id,
        'name' => 'Plantilla derivada',
        'template_type' => 'sectors',
        'version' => 1,
        'schema_version' => '2.0',
        'source_media_id' => $media->id,
        'source_json' => $source,
        'checksum_sha256' => hash('sha256', $encoded),
        'status' => 'active',
        'validation_status' => 'valid',
        'created_by_user_id' => $admin->id,
    ]);

    foreach ($source['nodes'] as $index => $node) {
        LayoutTemplateNode::query()->create([
            'layout_template_id' => $template->id,
            'external_key' => $node['key'],
            'node_type' => $node['type'],
            'label' => $node['label'],
            'capacity' => $node['capacity'],
            'is_selectable' => $node['selectable'],
            'sale_mode' => $node['sale_mode'],
            'geometry_json' => $node['geometry'],
            'style_json' => ['fill' => $index === 0 ? '#06b6d4' : '#f59e0b'],
            'metadata_json' => $node['metadata'],
            'sort_order' => $index,
        ]);
    }

    $this->actingAs($admin)
        ->post(route('admin.events.store'), [
            'name' => 'Evento derivado del plano',
            'event_category_id' => $category->id,
            'layout_template_id' => $template->id,
            'short_description' => 'Se crean tipos de entrada desde la plantilla.',
            'description' => 'Descripción de prueba.',
            'venue_name' => 'Teatro Central',
            'venue_address' => 'Av. Principal 123',
            'city' => 'La Paz',
            'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addWeek()->addHours(3)->format('Y-m-d\TH:i'),
            'sales_start_at' => now()->format('Y-m-d\TH:i'),
            'sales_end_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'status' => 'published',
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', 'Evento derivado del plano')->firstOrFail();
    $occurrence = $event->occurrences()->with(['ticketTypes.locations'])->firstOrFail();

    expect($occurrence->capacity_snapshot)->toBe(120)
        ->and($occurrence->ticketTypes)->toHaveCount(2)
        ->and($occurrence->ticketTypes->pluck('name')->all())->toBe(['Gold', 'Silver'])
        ->and($occurrence->ticketTypes->pluck('code')->all())->toBe(['GOLD', 'SILVER'])
        ->and($occurrence->ticketTypes->pluck('quota_total')->all())->toBe([40, 80])
        ->and($occurrence->ticketTypes->pluck('base_price')->all())->toBe(['100.00', '60.00'])
        ->and($occurrence->ticketTypes->pluck('locations')->map->count()->all())->toBe([1, 1]);
});
