<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('disk', 50);
            $table->string('path', 500);
            $table->string('original_name', 255);
            $table->string('mime_type', 120);
            $table->bigInteger('size_bytes');
            $table->char('checksum_sha256', 64)->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->uuid('uploaded_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('legal_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('document_type', 30);
            $table->string('version', 30);
            $table->text('content');
            $table->timestampTz('published_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by_user_id');
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['company_id', 'document_type', 'version']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('legal_acceptances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('legal_document_id');
            $table->uuid('customer_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('sale_id')->nullable();
            $table->timestampTz('accepted_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->foreign('legal_document_id')->references('id')->on('legal_documents')->cascadeOnDelete();
        });

        Schema::create('event_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name', 120);
            $table->string('slug', 140);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->unique(['company_id', 'slug']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('event_category_id')->nullable();
            $table->string('public_code', 40);
            $table->string('name', 220);
            $table->string('slug', 240);
            $table->string('short_description', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('venue_name', 220);
            $table->string('venue_address', 300)->nullable();
            $table->string('city', 120)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestampTz('published_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->uuid('created_by_user_id');
            $table->uuid('updated_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->unique(['company_id', 'public_code']);
            $table->unique(['company_id', 'slug']);
            $table->index(['company_id', 'status', 'published_at']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('event_category_id')->references('id')->on('event_categories')->nullOnDelete();
        });

        Schema::create('event_occurrences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->string('name', 180)->nullable();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at')->nullable();
            $table->timestampTz('doors_open_at')->nullable();
            $table->timestampTz('sales_start_at')->nullable();
            $table->timestampTz('sales_end_at')->nullable();
            $table->string('status', 20)->default('draft');
            $table->integer('capacity_snapshot')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->index(['status', 'starts_at']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });

        Schema::create('event_media', function (Blueprint $table) {
            $table->uuid('event_id');
            $table->uuid('media_asset_id');
            $table->string('media_role', 30)->default('gallery');
            $table->integer('sort_order')->default(0);
            $table->primary(['event_id', 'media_asset_id']);

            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('media_asset_id')->references('id')->on('media_assets')->cascadeOnDelete();
        });

        Schema::create('event_staff_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_occurrence_id');
            $table->uuid('user_id');
            $table->string('assignment_type', 30);
            $table->timestampTz('active_from')->nullable();
            $table->timestampTz('active_until')->nullable();
            $table->uuid('assigned_by_user_id');
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['event_occurrence_id', 'user_id', 'assignment_type']);
            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_staff_assignments');
        Schema::dropIfExists('event_media');
        Schema::dropIfExists('event_occurrences');
        Schema::dropIfExists('events');
        Schema::dropIfExists('event_categories');
        Schema::dropIfExists('legal_acceptances');
        Schema::dropIfExists('legal_documents');
        Schema::dropIfExists('media_assets');
    }
};
