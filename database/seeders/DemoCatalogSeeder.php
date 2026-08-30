<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Products\CreateProduct;
use App\Models\CashRegister;
use App\Models\Company;
use App\Models\EventCategory;
use App\Models\LayoutTemplate;
use App\Models\LayoutTemplateNode;
use App\Models\LegalDocument;
use App\Models\MediaAsset;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

final class DemoCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->firstOrFail();
        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

        foreach ([['Música', 'musica'], ['Teatro', 'teatro'], ['Conferencias', 'conferencias'], ['Deportes', 'deportes']] as $index => [$name, $slug]) {
            EventCategory::query()->updateOrCreate(['company_id' => $company->id, 'slug' => $slug], ['name' => $name, 'sort_order' => $index]);
        }

        foreach ([['Indumentaria', 'indumentaria'], ['Accesorios', 'accesorios'], ['Coleccionables', 'coleccionables']] as $index => [$name, $slug]) {
            ProductCategory::query()->updateOrCreate(['company_id' => $company->id, 'slug' => $slug], ['name' => $name, 'description' => 'Productos oficiales de '.$name, 'sort_order' => $index]);
        }

        $this->createLayouts($company, $admin);
        $this->createProducts($company, $admin);

        CashRegister::query()->updateOrCreate(
            ['company_id' => $company->id, 'code' => 'CAJA-01'],
            ['name' => 'Caja principal', 'is_primary' => true, 'is_active' => true],
        );

        foreach (['terms' => 'Términos y condiciones de compra de demostración.', 'privacy' => 'Política de privacidad y tratamiento de datos de demostración.'] as $type => $content) {
            LegalDocument::query()->updateOrCreate(
                ['company_id' => $company->id, 'document_type' => $type, 'version' => '1.0'],
                ['content' => $content, 'published_at' => now(), 'is_active' => true, 'created_by_user_id' => $admin->id],
            );
        }
    }

    private function createLayouts(Company $company, User $admin): void
    {
        $definitions = [
            'Auditorio numerado' => [
                'template_type' => 'sectors',
                'nodes' => [
                    ['platea-a', 'Platea A', 'seat_group', 80, 'individual'],
                    ['platea-b', 'Platea B', 'seat_group', 80, 'individual'],
                    ['balcon', 'Balcón', 'seat_group', 60, 'individual'],
                ],
            ],
            'Teatro clásico' => [
                'template_type' => 'sectors',
                'nodes' => [
                    ['vip', 'Palco VIP', 'box', 40, 'individual'],
                    ['orquesta', 'Orquesta', 'seat_group', 120, 'individual'],
                    ['galeria', 'Galería', 'seat_group', 80, 'individual'],
                ],
            ],
            'Mesas y boxes' => [
                'template_type' => 'mixed',
                'nodes' => [
                    ['mesa-oro', 'Mesa Oro', 'table', 60, 'group'],
                    ['mesa-plata', 'Mesa Plata', 'table', 80, 'group'],
                    ['boxes', 'Boxes', 'box', 40, 'group'],
                ],
            ],
            'Campo general' => [
                'template_type' => 'sectors',
                'nodes' => [
                    ['campo', 'Campo general', 'zone', 500, 'individual'],
                    ['graderia', 'Gradería', 'zone', 250, 'individual'],
                ],
            ],
            'Recinto mixto' => [
                'template_type' => 'mixed',
                'nodes' => [
                    ['campo-vip', 'Campo VIP', 'zone', 120, 'individual'],
                    ['campo-general', 'Campo general', 'zone', 300, 'individual'],
                    ['mesas', 'Mesas', 'table', 80, 'group'],
                ],
            ],
        ];

        foreach ($definitions as $name => $definition) {
            $nodes = $definition['nodes'];
            $source = [
                'schema_version' => '2.0',
                'template_type' => $definition['template_type'],
                'nodes' => array_map(
                    static fn (array $node, int $index): array => [
                        'key' => $node[0],
                        'label' => $node[1],
                        'type' => $node[2],
                        'capacity' => $node[3],
                        'selectable' => true,
                        'sale_mode' => $node[4],
                        'geometry' => ['x' => 20 + ($index * 140), 'y' => 40, 'width' => 120, 'height' => 100],
                    ],
                    $nodes,
                    array_keys($nodes),
                ),
            ];
            $encoded = json_encode($source, JSON_THROW_ON_ERROR);
            $media = MediaAsset::query()->create([
                'company_id' => $company->id,
                'disk' => 'local',
                'path' => 'demo/layouts/'.str($name)->slug().'.json',
                'original_name' => str($name)->slug().'.json',
                'mime_type' => 'application/json',
                'size_bytes' => strlen($encoded),
                'checksum_sha256' => hash('sha256', $encoded),
                'uploaded_by_user_id' => $admin->id,
            ]);
            $template = LayoutTemplate::query()->create([
                'company_id' => $company->id,
                'name' => $name,
                'template_type' => $definition['template_type'],
                'version' => 1,
                'schema_version' => '2.0',
                'source_media_id' => $media->id,
                'source_json' => $source,
                'checksum_sha256' => hash('sha256', $encoded),
                'status' => 'active',
                'validation_status' => 'valid',
                'created_by_user_id' => $admin->id,
            ]);

            foreach ($nodes as $index => [$key, $label, $type, $capacity, $saleMode]) {
                LayoutTemplateNode::query()->create([
                    'layout_template_id' => $template->id,
                    'external_key' => $key,
                    'node_type' => $type,
                    'label' => $label,
                    'capacity' => $capacity,
                    'is_selectable' => true,
                    'sale_mode' => $saleMode,
                    'geometry_json' => ['x' => 20 + ($index * 140), 'y' => 40, 'width' => 120, 'height' => 100],
                    'style_json' => ['fill' => ['#f59e0b', '#06b6d4', '#a855f7'][$index % 3]],
                    'metadata_json' => ['demo' => true],
                    'sort_order' => $index,
                ]);
            }
        }
    }

    private function createProducts(Company $company, User $admin): void
    {
        $categories = ProductCategory::query()->where('company_id', $company->id)->pluck('id', 'slug');
        $products = [
            ['Polera EVENTA Tour', 'Indumentaria oficial en algodón premium.', 'variant', 'indumentaria', true, [['Negra S', 'EV-POL-NEG-S', '789000001', '120.00', '55.00', 45, 8], ['Negra M', 'EV-POL-NEG-M', '789000002', '120.00', '55.00', 45, 8], ['Negra L', 'EV-POL-NEG-L', '789000003', '120.00', '55.00', 35, 8]]],
            ['Gorra Festival', 'Gorra ajustable edición festival.', 'simple', 'indumentaria', true, [['Única', 'EV-GOR-001', '789000010', '85.00', '32.00', 30, 6]]],
            ['Póster numerado', 'Impresión limitada para coleccionistas.', 'simple', 'coleccionables', true, [['Edición 2026', 'EV-POS-001', '789000040', '65.00', '18.00', 8, 5]]],
            ['Buzo con capucha', 'Buzo oversize de frisa con estampa del tour.', 'variant', 'indumentaria', true, [['Gris M', 'EV-BUZ-GRI-M', '789000050', '210.00', '95.00', 25, 5], ['Gris L', 'EV-BUZ-GRI-L', '789000051', '210.00', '95.00', 20, 5]]],
            ['Tote bag lona', 'Bolso de lona resistente con serigrafía.', 'simple', 'accesorios', true, [['Única', 'EV-TOT-001', '789000060', '55.00', '18.00', 60, 12]]],
            ['Sticker pack', 'Set de 12 stickers vinílicos resistentes al agua.', 'simple', 'coleccionables', true, [['Pack x12', 'EV-STK-001', '789000070', '25.00', '7.00', 120, 20]]],
            ['Taza cerámica', 'Taza de cerámica esmaltada, 350 ml.', 'simple', 'coleccionables', true, [['Única', 'EV-TAZ-001', '789000080', '45.00', '15.00', 70, 12]]],
            ['Pin esmaltado', 'Pin metálico con esmalte duro y broche mariposa.', 'simple', 'accesorios', true, [['Única', 'EV-PIN-001', '789000090', '18.00', '5.00', 150, 25]]],
            ['Bandana estampada', 'Bandana de algodón 55x55 cm.', 'simple', 'accesorios', true, [['Única', 'EV-BAN-001', '789000100', '32.00', '10.00', 40, 8]]],
            ['Camiseta tie-dye', 'Camiseta teñida a mano, cada pieza es única.', 'variant', 'indumentaria', true, [['S', 'EV-TDY-001', '789000110', '135.00', '58.00', 18, 4], ['M', 'EV-TDY-002', '789000111', '135.00', '58.00', 22, 4]]],
        ];

        foreach ($products as [$name, $description, $type, $category, $featured, $variants]) {
            app(CreateProduct::class)->handle($company, [
                'name' => $name,
                'description' => $description,
                'product_type' => $type,
                'status' => 'published',
                'is_featured' => $featured,
                'hide_when_out_of_stock' => true,
                'category_ids' => [$categories[$category]],
                'variants' => array_map(fn (array $variant): array => ['name' => $variant[0], 'sku' => $variant[1], 'barcode' => $variant[2], 'sale_price' => $variant[3], 'purchase_cost' => $variant[4], 'stock' => $variant[5], 'low_stock_threshold' => $variant[6]], $variants),
            ], $admin);
        }
    }
}
