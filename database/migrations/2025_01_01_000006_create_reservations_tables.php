<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_occurrence_id');
            $table->uuid('sale_id')->nullable()->unique();
            $table->uuid('customer_id')->nullable();
            $table->char('session_token_hash', 64);
            $table->string('status', 30)->default('temporary_selection');
            $table->timestampTz('selection_expires_at');
            $table->timestampTz('payment_expires_at')->nullable();
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('expired_at')->nullable();
            $table->string('buyer_name', 180)->nullable();
            $table->string('buyer_email', 180)->nullable();
            $table->string('buyer_phone', 40)->nullable();
            $table->string('buyer_identity_document', 80)->nullable();
            $table->uuid('created_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->index(['status', 'selection_expires_at']);
            $table->index(['status', 'payment_expires_at']);
            $table->index(['event_occurrence_id', 'status']);
            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
        });

        Schema::create('ticket_reservation_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_reservation_id');
            $table->uuid('ticket_type_id');
            $table->uuid('event_location_id');
            $table->integer('quantity');
            $table->decimal('unit_price_snapshot', 14, 2);
            $table->decimal('line_subtotal', 14, 2);
            $table->string('status', 20)->default('held');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['ticket_reservation_id', 'event_location_id', 'ticket_type_id']);
            $table->foreign('ticket_reservation_id')->references('id')->on('ticket_reservations')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
        });

        Schema::create('ticket_reservation_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_reservation_id');
            $table->string('event_type', 40);
            $table->string('previous_status', 30)->nullable();
            $table->string('new_status', 30)->nullable();
            $table->uuid('performed_by_user_id')->nullable();
            $table->uuid('payment_attempt_id')->nullable();
            $table->jsonb('metadata_json')->default('{}');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('ticket_reservation_id')->references('id')->on('ticket_reservations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_reservation_events');
        Schema::dropIfExists('ticket_reservation_items');
        Schema::dropIfExists('ticket_reservations');
    }
};
