<?php

declare(strict_types=1);

use App\Models\LayoutTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

dataset('guided layout templates', [
    'sectors' => [
        'sectors',
        [
            'mode' => 'create',
            'name' => 'Plantilla por sectores',
            'template_type' => 'sectors',
            'sectors' => [
                ['key' => 'vip', 'label' => 'VIP', 'price' => '250.00', 'capacity' => 40, 'color' => '#f59e0b'],
                ['key' => 'general', 'label' => 'General', 'price' => '120.00', 'capacity' => 120, 'color' => '#06b6d4'],
            ],
        ],
        2,
    ],
    'matrix' => [
        'matrix',
        [
            'mode' => 'create',
            'name' => 'Plantilla matriz',
            'template_type' => 'matrix',
            'matrix' => [
                'rows' => 3,
                'columns' => 4,
                'price' => '75.00',
                'disabled_cells' => ['1-1', '3-4'],
            ],
        ],
        16,
    ],
    'mixed' => [
        'mixed',
        [
            'mode' => 'create',
            'name' => 'Plantilla mixta',
            'template_type' => 'mixed',
            'mixed' => [
                'sectors' => [
                    [
                        'key' => 'vip',
                        'label' => 'VIP',
                        'price' => '300.00',
                        'color' => '#f59e0b',
                        'tables' => [
                            ['key' => 't1', 'label' => 'Mesa 1', 'chairs' => 4],
                        ],
                    ],
                    [
                        'key' => 'general',
                        'label' => 'General',
                        'price' => '180.00',
                        'color' => '#06b6d4',
                        'tables' => [
                            ['key' => 't2', 'label' => 'Mesa 2', 'chairs' => 6],
                            ['key' => 't3', 'label' => 'Mesa 3', 'chairs' => 6],
                        ],
                    ],
                ],
            ],
        ],
        21,
    ],
]);

it('creates guided layout templates for the three supported types', function (string $templateType, array $payload, int $expectedNodes): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $this->actingAs($admin)
        ->post(route('admin.layouts.store'), $payload)
        ->assertRedirect();

    $template = LayoutTemplate::query()->where('name', $payload['name'])->firstOrFail();

    expect($template->template_type)->toBe($templateType);
    expect($template->nodes)->toHaveCount($expectedNodes);
    expect($template->source_json['template_type'])->toBe($templateType);
})->with('guided layout templates');

it('imports a legacy json layout and infers the template type', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $source = [
        'schema_version' => '1.0',
        'nodes' => [
            [
                'key' => 'vip',
                'label' => 'VIP',
                'type' => 'table',
                'capacity' => 6,
                'selectable' => true,
                'sale_mode' => 'group',
                'geometry' => ['x' => 20, 'y' => 20, 'width' => 120, 'height' => 90],
            ],
            [
                'key' => 'vip-chair-1',
                'label' => 'Silla 1',
                'type' => 'seat',
                'parent' => 'vip',
                'capacity' => 1,
                'selectable' => true,
                'sale_mode' => 'individual',
                'geometry' => ['x' => 28, 'y' => 32, 'width' => 16, 'height' => 16],
            ],
        ],
    ];

    $file = UploadedFile::fake()->createWithContent('legacy-layout.json', json_encode($source, JSON_THROW_ON_ERROR));

    $this->actingAs($admin)
        ->post(route('admin.layouts.store'), [
            'mode' => 'import',
            'name' => 'Plano legacy',
            'layout_file' => $file,
        ])
        ->assertRedirect();

    $template = LayoutTemplate::query()->where('name', 'Plano legacy')->firstOrFail();

    expect($template->template_type)->toBe('mixed');
    expect($template->nodes)->toHaveCount(2);
});
