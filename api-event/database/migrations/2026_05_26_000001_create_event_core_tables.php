<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('admin_users')) {
            Schema::create('admin_users', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('full_name');
                $table->string('email')->unique();
                $table->string('password_hash')->nullable();
                $table->enum('role', ['super_admin', 'admin_event', 'finance', 'scanner'])->default('admin_event');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index('role');
            });
        }

        if (!Schema::hasTable('speakers')) {
            Schema::create('speakers', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('nama_lengkap');
                $table->text('alamat')->nullable();
                $table->json('keahlian')->nullable();
                $table->string('no_telp', 20)->nullable();
                $table->string('portfolio_url', 500)->nullable();
                $table->string('kategori', 100)->default('Lainnya');
                $table->string('foto_path', 500)->nullable();
                $table->text('bio')->nullable();
                $table->timestamps();
                $table->index('kategori');
            });
        }

        if (!Schema::hasTable('bank_accounts')) {
            Schema::create('bank_accounts', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('bank_name', 100);
                $table->string('account_number', 50);
                $table->string('account_name', 200);
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->nullable();
            });
        }

        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('title', 500);
                $table->enum('category', ['Pelatihan', 'Seremonial', 'Rapat']);
                $table->enum('event_type', ['Sistem Kelas', 'Non-Kelas'])->default('Non-Kelas');
                $table->string('poster_path', 500)->nullable();
                $table->text('description')->nullable();
                $table->string('location_name', 500)->nullable();
                $table->string('location_gmaps', 500)->nullable();
                $table->dateTime('start_date');
                $table->dateTime('registration_deadline')->nullable();
                $table->boolean('is_open_for_public')->default(true);
                $table->boolean('is_paid')->default(false);
                $table->unsignedInteger('price_niam')->default(0);
                $table->unsignedInteger('price_public')->default(0);
                $table->unsignedInteger('max_participants')->nullable();
                $table->unsignedInteger('current_participants')->default(0);
                $table->enum('status_pendaftaran', ['open', 'closed', 'full'])->default('open');
                $table->enum('status', ['DRAFT', 'PENDING', 'APPROVED', 'LIVE', 'FINISHED', 'COMPLETED'])->default('DRAFT');
                $table->enum('payment_method', ['manual', 'gateway'])->default('manual');
                $table->string('gateway_provider', 50)->nullable();
                $table->json('gateway_config')->nullable();
                $table->char('bank_account_id', 36)->nullable();
                $table->char('speaker_id', 36)->nullable();
                $table->string('gdrive_lpj', 500)->nullable();
                $table->char('created_by', 36)->nullable();
                $table->timestamps();
                $table->foreign('bank_account_id')->references('id')->on('bank_accounts')->nullOnDelete();
                $table->foreign('speaker_id')->references('id')->on('speakers')->nullOnDelete();
                $table->foreign('created_by')->references('id')->on('admin_users')->nullOnDelete();
                $table->index('status');
                $table->index('start_date');
                $table->index('status_pendaftaran');
            });
        }

        if (!Schema::hasTable('event_guests')) {
            Schema::create('event_guests', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('full_name');
                $table->string('institution_name')->nullable();
                $table->string('whatsapp', 20)->unique();
                $table->string('id_card_path', 500)->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }

        if (!Schema::hasTable('crew_members')) {
            Schema::create('crew_members', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('niam', 50)->unique();
                $table->string('full_name');
                $table->string('unit')->nullable();
                $table->string('photo_path', 500)->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }

        if (!Schema::hasTable('event_participants')) {
            Schema::create('event_participants', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->char('event_id', 36);
                $table->char('crew_id', 36)->nullable();
                $table->char('guest_id', 36)->nullable();
                $table->enum('registration_path', ['NIAM', 'UMUM']);
                $table->enum('payment_status', ['Free', 'Unpaid', 'Pending_Approval', 'Paid'])->default('Unpaid');
                $table->unsignedInteger('unique_amount')->default(0);
                $table->string('payment_proof_path', 500)->nullable();
                $table->enum('attendance_status', ['Registered', 'Attended', 'Cancelled'])->default('Registered');
                $table->string('qr_token', 100)->unique();
                $table->dateTime('attended_at')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
                $table->foreign('crew_id')->references('id')->on('crew_members')->nullOnDelete();
                $table->foreign('guest_id')->references('id')->on('event_guests')->nullOnDelete();
                $table->unique(['event_id', 'crew_id']);
                $table->unique(['event_id', 'guest_id']);
                $table->index('event_id');
                $table->index('qr_token');
                $table->index('payment_status');
                $table->index('attendance_status');
            });
        }

        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->char('participant_id', 36);
                $table->unsignedInteger('amount');
                $table->enum('status', ['Unpaid', 'Pending_Approval', 'Paid', 'Rejected'])->default('Unpaid');
                $table->string('proof_path', 500)->nullable();
                $table->dateTime('submitted_at')->nullable();
                $table->char('verified_by', 36)->nullable();
                $table->dateTime('verified_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
                $table->foreign('participant_id')->references('id')->on('event_participants')->cascadeOnDelete();
                $table->foreign('verified_by')->references('id')->on('admin_users')->nullOnDelete();
                $table->index('status');
            });
        }

        if (!Schema::hasTable('event_custom_fields')) {
            Schema::create('event_custom_fields', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->char('event_id', 36);
                $table->string('label');
                $table->enum('type', ['short_text', 'long_text', 'radio', 'dropdown', 'checkbox']);
                $table->json('options')->nullable();
                $table->boolean('is_required')->default(false);
                $table->integer('order_num')->default(0);
                $table->timestamp('created_at')->nullable();
                $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
                $table->index('event_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('event_custom_fields');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('event_participants');
        Schema::dropIfExists('crew_members');
        Schema::dropIfExists('event_guests');
        Schema::dropIfExists('events');
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('speakers');
        Schema::dropIfExists('admin_users');
    }
};
