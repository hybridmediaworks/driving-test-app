<?php

use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A per-user "Challenge Bank" — the questions a learner got wrong and should re-practice.
     * Rows are added automatically when an attempt is graded (see GradeQuizAttempt) and removed
     * once the learner answers that question correctly (in the Challenge Bank or any later quiz).
     * `unique(user_id, quiz_question_id)` keeps one row per question; both FKs cascade so a deleted
     * user or question cleans up after itself.
     */
    public function up(): void
    {
        Schema::create('challenge_bank_items', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(QuizQuestion::class)->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'quiz_question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challenge_bank_items');
    }
};
