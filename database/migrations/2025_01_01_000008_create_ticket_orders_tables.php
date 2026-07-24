<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id')->unique();
            $table->uuid('ticket_reservation_id')->unique();
            $table->uuid('event_occurrence_id');
            $table->string('order_number', 50)->unique();
            $table->string('buyer_name', 180)->nullable();
            $table->string('buyer_email', 180)->nullable();
            $table->string('buyer_phone', 40)->nullable();
            $table->string('buyer_identity_document', 80)->nullable();
            $table->string('event_name_snapshot', 220);
            $table->timestampTz('occurrence_starts_at_snapshot');
            $table->string('status', 20)->default('paid');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('cancelled_at')->nullable();
            $table->uuid('cancelled_by_user_id')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('ticket_reservation_id')->references('id')->on('ticket_reservations')->cascadeOnDelete();
            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
        });

        Schema::create('ticket_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_order_id');
            $table->uuid('ticket_type_id');
            $table->uuid('event_location_id');
            $table->string('ticket_type_name_snapshot', 160);
            $table->string('location_label_snapshot', 160)->nullable();
            $table->string('location_external_key_snapshot', 140);
            $table->integer('quantity');
            $table->decimal('unit_price', 14, 2);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('line_total', 14, 2);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('ticket_order_id')->references('id')->on('ticket_orders')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
        });

        Schema::create('courtesy_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_occurrence_id');
            $table->string('public_number', 50)->unique();
            $table->string('recipient_name', 180)->nullable();
            $table->string('recipient_email', 180)->nullable();
            $table->string('recipient_phone', 40)->nullable();
            $table->text('reason')->nullable();
            $table->string('status', 20)->default('issued');
            $table->uuid('issued_by_user_id');
            $table->timestampTz('issued_at')->useCurrent();
            $table->uuid('cancelled_by_user_id')->nullable();
            $table->timestampTz('cancelled_at')->nullable();

            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
        });

        Schema::create('courtesy_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('courtesy_batch_id');
            $table->uuid('ticket_type_id');
            $table->uuid('event_location_id');
            $table->integer('quantity');
            $table->string('ticket_type_name_snapshot', 160);
            $table->string('location_label_snapshot', 160)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('courtesy_batch_id')->references('id')->on('courtesy_batches')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courtesy_items');
        Schema::dropIfExists('courtesy_batches');
        Schema::dropIfExists('ticket_order_items');
        Schema::dropIfExists('ticket_orders');
    }
};
