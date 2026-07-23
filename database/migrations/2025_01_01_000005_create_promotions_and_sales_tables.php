<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->string('code', 80);
            $table->string('discount_type', 20);
            $table->decimal('discount_value', 14, 2);
            $table->decimal('minimum_amount', 14, 2)->nullable();
            $table->decimal('maximum_discount', 14, 2)->nullable();
            $table->integer('maximum_redemptions')->nullable();
            $table->integer('maximum_per_customer')->nullable();
            $table->timestampTz('starts_at')->nullable();
            $table->timestampTz('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by_user_id');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['event_id', 'code']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });

        Schema::create('promotion_ticket_types', function (Blueprint $table) {
            $table->uuid('promotion_code_id');
            $table->uuid('ticket_type_id');
            $table->primary(['promotion_code_id', 'ticket_type_id']);

            $table->foreign('promotion_code_id')->references('id')->on('promotion_codes')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
        });

        Schema::create('promotion_redemptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('promotion_code_id');
            $table->uuid('sale_id');
            $table->uuid('customer_id')->nullable();
            $table->decimal('discount_amount', 14, 2);
            $table->string('status', 20)->default('reserved');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('consumed_at')->nullable();

            $table->foreign('promotion_code_id')->references('id')->on('promotion_codes')->cascadeOnDelete();
        });

        Schema::create('number_sequences', function (Blueprint $table) {
            $table->uuid('company_id');
            $table->string('sequence_type', 30);
            $table->smallInteger('year');
            $table->bigInteger('current_value')->default(0);
            $table->timestampTz('updated_at')->useCurrent();
            $table->primary(['company_id', 'sequence_type', 'year']);

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('public_number', 50);
            $table->string('sale_type', 20);
            $table->string('channel', 30)->default('web');
            $table->uuid('customer_id')->nullable();
            $table->uuid('created_by_user_id')->nullable();
            $table->char('currency_code', 3)->default('BOB');
            $table->decimal('subtotal_amount', 14, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->string('status', 30)->default('draft');
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('expired_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->jsonb('metadata_json')->default('{}');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['company_id', 'public_number']);
            $table->index(['company_id', 'sale_type', 'status', 'created_at']);
            $table->index(['customer_id', 'created_at']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('sale_discounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id');
            $table->uuid('promotion_code_id')->nullable();
            $table->string('description', 220);
            $table->string('discount_type_snapshot', 20);
            $table->decimal('discount_value_snapshot', 14, 2);
            $table->decimal('discount_amount', 14, 2);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_discounts');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('number_sequences');
        Schema::dropIfExists('promotion_redemptions');
        Schema::dropIfExists('promotion_ticket_types');
        Schema::dropIfExists('promotion_codes');
    }
};
