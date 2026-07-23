<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('layout_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name', 180);
            $table->integer('version')->default(1);
            $table->string('schema_version', 30)->default('1.0');
            $table->uuid('source_media_id');
            $table->jsonb('source_json');
            $table->char('checksum_sha256', 64);
            $table->string('status', 20)->default('active');
            $table->string('validation_status', 20)->default('pending');
            $table->jsonb('validation_errors')->nullable();
            $table->uuid('created_by_user_id');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->unique(['company_id', 'name', 'version']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('layout_template_nodes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('layout_template_id');
            $table->uuid('parent_id')->nullable();
            $table->string('external_key', 140);
            $table->string('node_type', 30);
            $table->string('label', 150)->nullable();
            $table->integer('capacity')->default(1);
            $table->boolean('is_selectable')->default(true);
            $table->string('sale_mode', 20)->default('individual');
            $table->jsonb('geometry_json')->default('{}');
            $table->jsonb('style_json')->default('{}');
            $table->jsonb('metadata_json')->default('{}');
            $table->integer('sort_order')->default(0);
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['layout_template_id', 'external_key']);
            $table->foreign('layout_template_id')->references('id')->on('layout_templates')->cascadeOnDelete();
        });

        Schema::table('layout_template_nodes', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('layout_template_nodes')->nullOnDelete();
        });

        Schema::create('event_layouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_occurrence_id');
            $table->uuid('layout_template_id');
            $table->integer('template_version');
            $table->jsonb('snapshot_json');
            $table->string('status', 20)->default('draft');
            $table->timestampTz('activated_at')->nullable();
            $table->uuid('created_by_user_id');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
            $table->foreign('layout_template_id')->references('id')->on('layout_templates')->cascadeOnDelete();
        });

        Schema::create('event_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_layout_id');
            $table->uuid('template_node_id')->nullable();
            $table->uuid('parent_id')->nullable();
            $table->string('external_key', 140);
            $table->string('location_type', 30);
            $table->string('label', 150)->nullable();
            $table->integer('capacity_total')->default(1);
            $table->boolean('is_selectable')->default(true);
            $table->boolean('is_visible')->default(true);
            $table->boolean('is_enabled')->default(true);
            $table->string('sale_mode', 20)->default('individual');
            $table->jsonb('geometry_json')->default('{}');
            $table->jsonb('style_json')->default('{}');
            $table->jsonb('metadata_json')->default('{}');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['event_layout_id', 'external_key']);
            $table->foreign('event_layout_id')->references('id')->on('event_layouts')->cascadeOnDelete();
        });

        Schema::table('event_locations', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('event_locations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_locations');
        Schema::dropIfExists('event_layouts');
        Schema::dropIfExists('layout_template_nodes');
        Schema::dropIfExists('layout_templates');
    }
};
