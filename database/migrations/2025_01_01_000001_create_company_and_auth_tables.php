<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('legal_name', 180);
            $table->string('commercial_name', 180);
            $table->string('tax_identifier', 50)->nullable();
            $table->string('contact_email', 180)->nullable();
            $table->string('contact_phone', 40)->nullable();
            $table->uuid('logo_media_id')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
        });

        Schema::create('company_settings', function (Blueprint $table) {
            $table->uuid('company_id')->primary();
            $table->char('currency_code', 3)->default('BOB');
            $table->string('timezone', 80)->default('America/La_Paz');
            $table->smallInteger('temporary_selection_minutes')->default(5);
            $table->smallInteger('payment_reservation_minutes')->default(20);
            $table->string('sender_name', 150)->nullable();
            $table->string('sender_email', 180)->nullable();
            $table->string('support_email', 180)->nullable();
            $table->string('support_phone', 40)->nullable();
            $table->string('primary_color', 20)->nullable();
            $table->string('secondary_color', 20)->nullable();
            $table->jsonb('settings_json')->default('{}');
            $table->uuid('updated_by_user_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable()->unique();
            $table->string('full_name', 180);
            $table->string('email', 180)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('identity_document', 80)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->softDeletesTz('deleted_at');

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name', 100);
            $table->string('code', 100);
            $table->string('module', 30)->default('tickets');
            $table->boolean('is_system')->default(false);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['company_id', 'code']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 140)->unique();
            $table->string('module', 30);
            $table->string('description', 255);
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->uuid('permission_id');
            $table->primary(['role_id', 'permission_id']);

            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('user_id');
            $table->uuid('role_id');
            $table->uuid('assigned_by_user_id')->nullable();
            $table->timestampTz('assigned_at')->useCurrent();
            $table->primary(['user_id', 'role_id']);

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->foreign('assigned_by_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('company_settings');
        Schema::dropIfExists('companies');
    }
};
