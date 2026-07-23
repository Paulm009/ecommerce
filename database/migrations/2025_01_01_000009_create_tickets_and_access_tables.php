<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_occurrence_id');
            $table->uuid('ticket_order_id')->nullable();
            $table->uuid('courtesy_batch_id')->nullable();
            $table->string('public_code', 70)->unique();
            $table->char('qr_token_hash', 64)->unique();
            $table->string('status', 20)->default('active');
            $table->integer('quota_total');
            $table->integer('quota_used')->default(0);
            $table->string('recipient_name', 180)->nullable();
            $table->string('recipient_email', 180)->nullable();
            $table->timestampTz('issued_at')->useCurrent();
            $table->timestampTz('voided_at')->nullable();
            $table->uuid('voided_by_user_id')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestampTz('last_sent_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->index(['event_occurrence_id', 'status']);
            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
            $table->foreign('ticket_order_id')->references('id')->on('ticket_orders')->nullOnDelete();
            $table->foreign('courtesy_batch_id')->references('id')->on('courtesy_batches')->nullOnDelete();
        });

        Schema::create('ticket_entitlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('ticket_order_item_id')->nullable();
            $table->uuid('courtesy_item_id')->nullable();
            $table->uuid('ticket_type_id');
            $table->uuid('event_location_id');
            $table->integer('quantity');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('ticket_id')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
            $table->foreign('event_location_id')->references('id')->on('event_locations')->cascadeOnDelete();
        });

        Schema::create('ticket_status_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->string('previous_status', 20)->nullable();
            $table->string('new_status', 20);
            $table->text('reason')->nullable();
            $table->uuid('performed_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('ticket_id')->references('id')->on('tickets')->cascadeOnDelete();
        });

        Schema::create('access_scans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_occurrence_id');
            $table->uuid('ticket_id')->nullable();
            $table->uuid('scanner_user_id');
            $table->char('qr_fingerprint', 64)->nullable();
            $table->string('scan_result', 40);
            $table->integer('consumed_quantity')->default(0);
            $table->integer('quota_before')->nullable();
            $table->integer('quota_after')->nullable();
            $table->string('device_identifier', 180)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('notes')->nullable();
            $table->timestampTz('scanned_at')->useCurrent();

            $table->index(['event_occurrence_id', 'scanned_at']);
            $table->index(['ticket_id', 'scanned_at']);
            $table->index(['scanner_user_id', 'scanned_at']);
            $table->foreign('event_occurrence_id')->references('id')->on('event_occurrences')->cascadeOnDelete();
            $table->foreign('ticket_id')->references('id')->on('tickets')->nullOnDelete();
            $table->foreign('scanner_user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_scans');
        Schema::dropIfExists('ticket_status_history');
        Schema::dropIfExists('ticket_entitlements');
        Schema::dropIfExists('tickets');
    }
};
