<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Let signed-out learners keep a Challenge Bank ("Quiz Vault") too. A guest's wrong questions
     * are filed under their per-install `guest_token` — the same token attempts already use — and
     * claimed into their account on login/register (see AuthController::claimGuestData). Exactly one
     * of `user_id` / `guest_token` is set on a row, never both. `unique(guest_token, quiz_question_id)`
     * dedups a guest's rows the same way `unique(user_id, quiz_question_id)` already dedups a user's.
     */
    public function up(): void
    {
        Schema::table('challenge_bank_items', function (Blueprint $table): void {
            // Guest rows have no user_id, so it can no longer be NOT NULL.
            $table->foreignId('user_id')->nullable()->change();
            $table->string('guest_token')->nullable()->after('user_id');
            $table->index('guest_token');
            $table->unique(['guest_token', 'quiz_question_id']);
        });
    }

    public function down(): void
    {
        Schema::table('challenge_bank_items', function (Blueprint $table): void {
            $table->dropUnique(['guest_token', 'quiz_question_id']);
            $table->dropIndex(['guest_token']);
            $table->dropColumn('guest_token');
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
