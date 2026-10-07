<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Why a question is in the Quiz Vault, which until now the row did not say.
     *
     * One row per (owner, question) carried two different meanings at once: "you got this wrong" and
     * "you saved this". They behave differently and were standing on each other — answering a
     * question right deletes its row, which silently threw away a bookmark the learner had chosen to
     * keep, and un-bookmarking deleted the row that was there because they had missed it. The web
     * vault also shows the two as separate lists, which no row could answer.
     *
     * Existing rows all came from the grader, so `missed` defaults true and backfills them correctly.
     * A row survives while either flag is set and is deleted once both are clear.
     */
    public function up(): void
    {
        Schema::table('challenge_bank_items', function (Blueprint $table) {
            $table->boolean('missed')->default(true)->after('quiz_question_id');
            $table->boolean('bookmarked')->default(false)->after('missed');
        });
    }

    public function down(): void
    {
        Schema::table('challenge_bank_items', function (Blueprint $table) {
            $table->dropColumn(['missed', 'bookmarked']);
        });
    }
};
