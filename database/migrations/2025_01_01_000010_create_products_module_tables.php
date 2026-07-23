<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('parent_id')->nullable();
            $table->string('name', 160);
            $table->string('slug', 180);
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->unique(['company_id', 'slug']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::table('product_categories', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('product_categories')->nullOnDelete();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name', 220);
            $table->string('slug', 240);
            $table->text('description')->nullable();
            $table->string('product_type', 20)->default('simple');
            $table->string('status', 20)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->boolean('hide_when_out_of_stock')->default(false);
            $table->timestampTz('published_at')->nullable();
            $table->uuid('created_by_user_id');
            $table->uuid('updated_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->unique(['company_id', 'slug']);
            $table->index(['company_id', 'status', 'is_featured']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('product_category_links', function (Blueprint $table) {
            $table->uuid('product_id');
            $table->uuid('product_category_id');
            $table->boolean('is_primary')->default(false);
            $table->primary(['product_id', 'product_category_id']);

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->foreign('product_category_id')->references('id')->on('product_categories')->cascadeOnDelete();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->string('name', 180)->nullable();
            $table->string('sku', 100)->unique();
            $table->string('barcode', 120)->nullable()->unique();
            $table->decimal('sale_price', 14, 2);
            $table->decimal('purchase_cost', 14, 2)->default(0);
            $table->integer('low_stock_threshold')->default(10);
            $table->jsonb('attributes_json')->default('{}');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });

        Schema::create('product_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->uuid('product_variant_id')->nullable();
            $table->uuid('media_asset_id');
            $table->string('media_role', 20)->default('gallery');
            $table->integer('sort_order')->default(0);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->nullOnDelete();
            $table->foreign('media_asset_id')->references('id')->on('media_assets')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_media');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_category_links');
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_categories');
    }
};
