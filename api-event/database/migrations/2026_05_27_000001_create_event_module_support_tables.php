<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('event_attendance_logs')) {
            Schema::create('event_attendance_logs', function (Blueprint $table) {
                $table->id();
                $table->char('event_id', 36);
                $table->char('participant_id', 36);
                $table->string('qr_token', 100);
                $table->string('scanned_by_name')->nullable();
                $table->string('scanner_device')->nullable();
                $table->timestamp('scanned_at');
                $table->boolean('success')->default(true);
                $table->string('failure_reason')->nullable();
                $table->timestamps();

                $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
                $table->foreign('participant_id')->references('id')->on('event_participants')->cascadeOnDelete();
                $table->index(['event_id', 'success']);
                $table->index('qr_token');
            });
        }

        if (!Schema::hasTable('event_finance_transactions')) {
            Schema::create('event_finance_transactions', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->char('event_id', 36);
                $table->enum('type', ['income', 'expense']);
                $table->enum('source', ['payment', 'manual'])->default('manual');
                $table->string('title');
                $table->text('description')->nullable();
                $table->unsignedBigInteger('amount')->default(0);
                $table->enum('status', ['posted', 'void'])->default('posted');
                $table->timestamp('transaction_date')->nullable();
                $table->char('participant_id', 36)->nullable();
                $table->char('payment_id', 36)->nullable();
                $table->char('created_by', 36)->nullable();
                $table->char('updated_by', 36)->nullable();
                $table->timestamps();

                $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
                $table->foreign('participant_id')->references('id')->on('event_participants')->nullOnDelete();
                $table->foreign('payment_id')->references('id')->on('payments')->nullOnDelete();
                $table->index(['event_id', 'status']);
                $table->index(['type', 'source']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('event_finance_transactions');
        Schema::dropIfExists('event_attendance_logs');
    }
};
