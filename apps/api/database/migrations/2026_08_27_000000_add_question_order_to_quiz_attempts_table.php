<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            // Question id order captured once at attempt-start time, so a resumed attempt
            // reattaches to the exact same order instead of reshuffling. Null for attempts created
            // before this column existed, or by callers that never went through the start endpoint.
            $table->json('question_order')->nullable()->after('total_questions');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropColumn('question_order');
        });
    }
};
