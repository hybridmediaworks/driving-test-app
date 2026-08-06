<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pure traceability — the driving-tests.org page a quiz was crawled from, so imported content
     * can be spot-checked against its origin without a DB query. Not shown to end users.
     */
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->string('source_url')->nullable()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('source_url');
        });
    }
};
