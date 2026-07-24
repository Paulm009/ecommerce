<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_carts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->char('session_token_hash', 64)->nullable();
            $table->string('status', 20)->default('active');
            $table->char('currency_code', 3)->default('BOB');
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
        });

        Schema::create('shopping_cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('shopping_cart_id');
            $table->uuid('product_variant_id');
            $table->integer('quantity');
            $table->decimal('unit_price_snapshot', 14, 2);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['shopping_cart_id', 'product_variant_id']);
            $table->foreign('shopping_cart_id')->references('id')->on('shopping_carts')->cascadeOnDelete();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });

        Schema::create('product_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id')->unique();
            $table->uuid('shopping_cart_id')->nullable();
            $table->string('order_number', 50)->unique();
            $table->uuid('customer_id')->nullable();
            $table->string('buyer_name', 180);
            $table->string('buyer_email', 180)->nullable();
            $table->string('buyer_phone', 40)->nullable();
            $table->string('buyer_identity_document', 80)->nullable();
            $table->string('status', 30)->default('pending_payment');
            $table->timestampTz('payment_expires_at')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->uuid('delivered_by_user_id')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->uuid('cancelled_by_user_id')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('fulfillment_notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->index(['status', 'created_at']);
            $table->index('buyer_email');
            $table->index('buyer_phone');
            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
        });

        Schema::create('product_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_order_id');
            $table->uuid('product_variant_id');
            $table->string('product_name_snapshot', 220);
            $table->string('variant_name_snapshot', 180)->nullable();
            $table->string('sku_snapshot', 100);
            $table->integer('quantity');
            $table->decimal('unit_price', 14, 2);
            $table->decimal('unit_cost', 14, 2);
            $table->decimal('line_subtotal', 14, 2);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('line_total', 14, 2);
            $table->decimal('cost_total', 14, 2);
            $table->decimal('profit_amount', 14, 2);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('product_order_id')->references('id')->on('product_orders')->cascadeOnDelete();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_order_items');
        Schema::dropIfExists('product_orders');
        Schema::dropIfExists('shopping_cart_items');
        Schema::dropIfExists('shopping_carts');
    }
};
