<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pass_guarantee_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->foreignId('family_group_id')->nullable()->constrained('family_groups')->nullOnDelete();
            $table->string('status')->default('submitted');
            // Server-computed at claim time from real quiz_attempts.user_id rows — never trust
            // client input here, and never guest_token rows (client-controllable, no guest-history
            // claiming flow exists to verify identity against).
            $table->timestamp('completed_practice_at');
            $table->date('exam_date')->nullable();
            $table->text('proof_notes')->nullable();
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_notes')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->string('stripe_refund_id')->nullable();
            $table->unsignedInteger('refund_amount_cents')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pass_guarantee_claims');
    }
};
