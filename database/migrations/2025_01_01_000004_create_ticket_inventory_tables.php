<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_occurrence_id');
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('code', 80);
            $table->decimal('base_price', 14, 2);
            $table->integer('quota_total')->nullable();
            $table->integer('minimum_per_order')->default(1);
            $table->integer('maximum_per_order')->nullable();
            $table->timestampTz('sales_start_at')->nullable();
            $table->timestampTz('sales_end_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->unique(['event_occurrence_id', 'code']);
            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
        });

        Schema::create('event_location_ticket_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_location_id');
            $table->uuid('ticket_type_id');
            $table->decimal('price_override', 14, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['event_location_id', 'ticket_type_id']);
            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
        });

        Schema::create('event_location_inventory', function (Blueprint $table) {
            $table->uuid('event_location_id')->primary();
            $table->integer('capacity_total');
            $table->integer('blocked_quantity')->default(0);
            $table->integer('selection_quantity')->default(0);
            $table->integer('payment_reserved_quantity')->default(0);
            $table->integer('sold_quantity')->default(0);
            $table->integer('courtesy_quantity')->default(0);
            $table->integer('available_quantity')->default(0);
            $table->bigInteger('lock_version')->default(0);
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
        });

        Schema::create('ticket_type_inventory', function (Blueprint $table) {
            $table->uuid('ticket_type_id')->primary();
            $table->integer('quota_total')->nullable();
            $table->integer('selection_quantity')->default(0);
            $table->integer('payment_reserved_quantity')->default(0);
            $table->integer('sold_quantity')->default(0);
            $table->integer('courtesy_quantity')->default(0);
            $table->integer('available_quantity')->nullable()->default(null);
            $table->bigInteger('lock_version')->default(0);
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
        });

        Schema::create('event_location_blocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_location_id');
            $table->integer('quantity');
            $table->string('block_type', 30);
            $table->text('reason')->nullable();
            $table->string('status', 20)->default('active');
            $table->uuid('blocked_by_user_id');
            $table->uuid('released_by_user_id')->nullable();
            $table->timestampTz('blocked_at')->useCurrent();
            $table->timestampTz('released_at')->nullable();

            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
        });

        Schema::create('event_inventory_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_location_id');
            $table->uuid('ticket_type_id')->nullable();
            $table->string('movement_type', 40);
            $table->integer('quantity');
            $table->string('from_bucket', 30)->nullable();
            $table->string('to_bucket', 30)->nullable();
            $table->uuid('reservation_item_id')->nullable();
            $table->uuid('ticket_order_item_id')->nullable();
            $table->uuid('courtesy_item_id')->nullable();
            $table->uuid('location_block_id')->nullable();
            $table->uuid('performed_by_user_id')->nullable();
            $table->jsonb('metadata_json')->default('{}');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_inventory_movements');
        Schema::dropIfExists('event_location_blocks');
        Schema::dropIfExists('ticket_type_inventory');
        Schema::dropIfExists('event_location_inventory');
        Schema::dropIfExists('event_location_ticket_types');
        Schema::dropIfExists('ticket_types');
    }
};
