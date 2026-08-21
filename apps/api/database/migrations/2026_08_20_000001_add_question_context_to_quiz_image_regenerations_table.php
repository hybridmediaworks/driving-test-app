<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The distinct question texts that use this image, captured at seed time. Fed into the Ideogram
     * prompt so the regenerated image keeps the exact meaning the questions test (e.g. the specific
     * road sign), which the visual caption alone can miss — otherwise the correct answer could break.
     */
    public function up(): void
    {
        Schema::table('quiz_image_regenerations', function (Blueprint $table) {
            $table->text('question_context')->nullable()->after('usage_count');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_image_regenerations', function (Blueprint $table) {
            $table->dropColumn('question_context');
        });
    }
};
