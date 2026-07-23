<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_balances', function (Blueprint $table) {
            $table->uuid('product_variant_id')->primary();
            $table->integer('on_hand_quantity')->default(0);
            $table->integer('reserved_quantity')->default(0);
            $table->integer('available_quantity')->default(0);
            $table->bigInteger('lock_version')->default(0);
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });

        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_order_item_id');
            $table->uuid('product_variant_id');
            $table->integer('quantity');
            $table->string('status', 20)->default('active');
            $table->timestampTz('expires_at');
            $table->timestampTz('consumed_at')->nullable();
            $table->timestampTz('released_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['status', 'expires_at']);
            $table->foreign('product_order_item_id')->references('id')->on('product_order_items')->cascadeOnDelete();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });

        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('adjustment_number', 50)->unique();
            $table->string('adjustment_type', 30);
            $table->text('reason');
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by_user_id');
            $table->uuid('confirmed_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('confirmed_at')->nullable();
        });

        Schema::create('inventory_adjustment_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('inventory_adjustment_id');
            $table->uuid('product_variant_id');
            $table->integer('quantity_delta');
            $table->decimal('unit_cost', 14, 2)->nullable();
            $table->text('notes')->nullable();

            $table->foreign('inventory_adjustment_id')->references('id')->on('inventory_adjustments')->cascadeOnDelete();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_variant_id');
            $table->string('movement_type', 40);
            $table->integer('on_hand_delta')->default(0);
            $table->integer('reserved_delta')->default(0);
            $table->integer('on_hand_before')->default(0);
            $table->integer('on_hand_after')->default(0);
            $table->integer('reserved_before')->default(0);
            $table->integer('reserved_after')->default(0);
            $table->uuid('product_order_item_id')->nullable();
            $table->uuid('pos_sale_item_id')->nullable();
            $table->uuid('inventory_reservation_id')->nullable();
            $table->uuid('inventory_adjustment_item_id')->nullable();
            $table->uuid('performed_by_user_id')->nullable();
            $table->text('reason')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['product_variant_id', 'created_at']);
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });

        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_variant_id');
            $table->string('alert_type', 30);
            $table->string('status', 20)->default('open');
            $table->integer('quantity_at_open');
            $table->timestampTz('opened_at')->useCurrent();
            $table->uuid('acknowledged_by_user_id')->nullable();
            $table->timestampTz('acknowledged_at')->nullable();
            $table->timestampTz('resolved_at')->nullable();

            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_alerts');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory_adjustment_items');
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('inventory_reservations');
        Schema::dropIfExists('inventory_balances');
    }
};
