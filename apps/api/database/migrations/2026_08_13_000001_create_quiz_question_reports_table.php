<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_question_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_question_id')->constrained('quiz_questions')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // Which parts of the question the reporter flagged, e.g.
            // {"question": true, "image": false, "hint": false, "answers": [12, 15]}.
            $table->json('flagged')->nullable();
            $table->text('comment');
            $table->string('reporter_name')->nullable();
            $table->string('reporter_email')->nullable();
            $table->timestamps();

            $table->index('quiz_question_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_question_reports');
    }
};
