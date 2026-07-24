<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name', 120);
            $table->string('code', 50);
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['company_id', 'code']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cash_register_id');
            $table->string('session_number', 50)->unique();
            $table->string('status', 20)->default('open');
            $table->uuid('opened_by_user_id');
            $table->timestampTz('opened_at')->useCurrent();
            $table->decimal('opening_amount', 14, 2)->default(0);
            $table->uuid('closed_by_user_id')->nullable();
            $table->timestampTz('closed_at')->nullable();
            $table->decimal('expected_amount', 14, 2)->nullable();
            $table->decimal('declared_amount', 14, 2)->nullable();
            $table->decimal('difference_amount', 14, 2)->nullable();
            $table->text('closing_notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('cash_register_id')->references('id')->on('cash_registers')->cascadeOnDelete();
            $table->foreign('opened_by_user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('pos_sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id')->unique();
            $table->string('sale_number', 50)->unique();
            $table->uuid('cash_session_id');
            $table->uuid('seller_user_id');
            $table->uuid('customer_id')->nullable();
            $table->string('status', 30)->default('pending_payment');
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->uuid('cancelled_by_user_id')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->index(['cash_session_id', 'status']);
            $table->index(['seller_user_id', 'created_at']);
            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('cash_session_id')->references('id')->on('cash_sessions')->cascadeOnDelete();
            $table->foreign('seller_user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('pos_sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pos_sale_id');
            $table->uuid('product_variant_id');
            $table->string('product_name_snapshot', 220);
            $table->string('variant_name_snapshot', 180)->nullable();
            $table->string('sku_snapshot', 100);
            $table->integer('quantity');
            $table->decimal('unit_price', 14, 2);
            $table->decimal('unit_cost', 14, 2);
            $table->decimal('line_total', 14, 2);
            $table->decimal('cost_total', 14, 2);
            $table->decimal('profit_amount', 14, 2);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('pos_sale_id')->references('id')->on('pos_sales')->cascadeOnDelete();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });

        Schema::create('cash_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cash_session_id');
            $table->string('movement_type', 30);
            $table->string('direction', 10);
            $table->decimal('amount', 14, 2);
            $table->uuid('pos_sale_id')->nullable();
            $table->uuid('payment_attempt_id')->nullable()->unique();
            $table->text('description');
            $table->uuid('created_by_user_id');
            $table->uuid('authorized_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['cash_session_id', 'created_at']);
            $table->foreign('cash_session_id')->references('id')->on('cash_sessions')->cascadeOnDelete();
            $table->foreign('pos_sale_id')->references('id')->on('pos_sales')->nullOnDelete();
            $table->foreign('payment_attempt_id')->references('id')->on('payment_attempts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('pos_sale_items');
        Schema::dropIfExists('pos_sales');
        Schema::dropIfExists('cash_sessions');
        Schema::dropIfExists('cash_registers');
    }
};
