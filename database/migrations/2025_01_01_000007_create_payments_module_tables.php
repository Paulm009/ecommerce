<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id');
            $table->string('provider_code', 50);
            $table->string('provider_reference', 180)->nullable();
            $table->string('provider_transaction_id', 180)->nullable();
            $table->string('idempotency_key', 180)->unique();
            $table->decimal('amount', 14, 2);
            $table->char('currency_code', 3)->default('BOB');
            $table->string('status', 30)->default('pending');
            $table->text('qr_payload_encrypted')->nullable();
            $table->timestampTz('qr_expires_at')->nullable();
            $table->timestampTz('requested_at')->useCurrent();
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('last_checked_at')->nullable();
            $table->string('failure_code', 100)->nullable();
            $table->text('failure_message')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->index(['sale_id', 'status']);
            $table->index(['status', 'qr_expires_at']);
            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
        });

        Schema::create('payment_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_attempt_id')->nullable();
            $table->string('provider_code', 50);
            $table->string('provider_event_id', 180)->nullable();
            $table->string('event_source', 30);
            $table->string('event_type', 80);
            $table->boolean('signature_valid')->nullable();
            $table->jsonb('raw_payload')->default('{}');
            $table->timestampTz('received_at')->useCurrent();
            $table->timestampTz('processed_at')->nullable();
            $table->string('processing_status', 20)->default('pending');
            $table->text('processing_message')->nullable();

            $table->foreign('payment_attempt_id')->references('id')->on('payment_attempts')->nullOnDelete();
            $table->unique(['provider_code', 'provider_event_id']);
        });

        Schema::create('payment_incidents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id');
            $table->uuid('payment_attempt_id');
            $table->uuid('ticket_reservation_id')->nullable();
            $table->string('incident_type', 40);
            $table->string('status', 30)->default('open');
            $table->decimal('expected_amount', 14, 2)->nullable();
            $table->decimal('received_amount', 14, 2)->nullable();
            $table->text('description');
            $table->uuid('assigned_to_user_id')->nullable();
            $table->timestampTz('opened_at')->useCurrent();
            $table->timestampTz('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();

            $table->index(['status', 'opened_at']);
            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('payment_attempt_id')->references('id')->on('payment_attempts')->cascadeOnDelete();
            $table->foreign('ticket_reservation_id')->references('id')->on('ticket_reservations')->nullOnDelete();
        });

        Schema::create('payment_incident_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_incident_id');
            $table->string('action_type', 40);
            $table->text('notes')->nullable();
            $table->uuid('performed_by_user_id');
            $table->jsonb('metadata_json')->default('{}');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('payment_incident_id')->references('id')->on('payment_incidents')->cascadeOnDelete();
        });

        Schema::create('manual_refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_incident_id');
            $table->uuid('payment_attempt_id');
            $table->decimal('amount', 14, 2);
            $table->string('status', 30)->default('pending');
            $table->text('reason');
            $table->uuid('approved_by_user_id')->nullable();
            $table->uuid('completed_by_user_id')->nullable();
            $table->string('external_reference', 180)->nullable();
            $table->uuid('proof_media_id')->nullable();
            $table->timestampTz('requested_at')->useCurrent();
            $table->timestampTz('completed_at')->nullable();
            $table->text('notes')->nullable();

            $table->foreign('payment_incident_id')->references('id')->on('payment_incidents')->cascadeOnDelete();
            $table->foreign('payment_attempt_id')->references('id')->on('payment_attempts')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manual_refunds');
        Schema::dropIfExists('payment_incident_actions');
        Schema::dropIfExists('payment_incidents');
        Schema::dropIfExists('payment_events');
        Schema::dropIfExists('payment_attempts');
    }
};
