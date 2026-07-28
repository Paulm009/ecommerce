<?php

declare(strict_types=1);

use App\Models\LayoutTemplate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('layout_templates', function (Blueprint $table) {
            $table->string('template_type', 20)->nullable()->after('name');
        });

        LayoutTemplate::query()
            ->select(['id', 'source_json'])
            ->chunkById(100, function ($templates): void {
                foreach ($templates as $template) {
                    $source = $template->source_json;
                    $templateType = $this->inferTemplateType(is_array($source) ? $source : []);

                    $template->update(['template_type' => $templateType]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('layout_templates', function (Blueprint $table) {
            $table->dropColumn('template_type');
        });
    }

    /**
     * @param array<string, mixed> $source
     */
    private function inferTemplateType(array $source): string
    {
        if (($source['template_type'] ?? null) === 'matrix') {
            return 'matrix';
        }

        if (($source['template_type'] ?? null) === 'mixed') {
            return 'mixed';
        }

        $nodes = isset($source['nodes']) && is_array($source['nodes']) ? $source['nodes'] : [];
        $nodeTypes = array_values(array_filter(array_map(
            static fn (mixed $node): ?string => is_array($node) && isset($node['type']) ? (string) $node['type'] : null,
            $nodes,
        )));

        if (array_intersect(['row', 'cell', 'matrix_cell'], $nodeTypes) !== []) {
            return 'matrix';
        }

        if (array_intersect(['table', 'seat'], $nodeTypes) !== []) {
            return 'mixed';
        }

        return 'sectors';
    }
};
