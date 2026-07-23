<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outbound_emails', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('template_code', 100);
            $table->string('recipient_email', 180);
            $table->string('recipient_name', 180)->nullable();
            $table->string('subject', 255);
            $table->string('related_type', 60)->nullable();
            $table->uuid('related_id')->nullable();
            $table->string('status', 20)->default('queued');
            $table->string('provider_message_id', 180)->nullable();
            $table->smallInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestampTz('queued_at')->useCurrent();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('outbox_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('aggregate_type', 60);
            $table->uuid('aggregate_id');
            $table->string('event_type', 100);
            $table->jsonb('payload_json')->default('{}');
            $table->string('status', 20)->default('pending');
            $table->timestampTz('available_at')->useCurrent();
            $table->timestampTz('processed_at')->nullable();
            $table->integer('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->nullable();
            $table->uuid('actor_user_id')->nullable();
            $table->string('action', 140);
            $table->string('entity_type', 100);
            $table->uuid('entity_id')->nullable();
            $table->jsonb('before_json')->nullable();
            $table->jsonb('after_json')->nullable();
            $table->text('reason')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->uuid('request_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('outbox_events');
        Schema::dropIfExists('outbound_emails');
    }
};
