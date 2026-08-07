<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Standalone instructional/road-test-commentary video library — not tied to a single quiz
     * question (see quiz_question_assets for that). Scoped exactly like cheat_sheets: nullable
     * FKs mean "applies universally." external_url/disk+path mirror quiz_question_assets for the
     * same reason (mostly links in the crawled dataset, some re-hosted files).
     */
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_category_id')->nullable()->constrained('quiz_categories')->restrictOnDelete();
            $table->foreignId('state_id')->nullable()->constrained('states')->restrictOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->constrained('vehicle_types')->restrictOnDelete();
            $table->string('test_track')->nullable();
            // The source's own free-text grouping label (e.g. "Learn to Drive Videos",
            // "Defensive Driving Hazard Simulators") — not forced through quiz_category_id, since
            // it doesn't reliably match our quiz-category vocabulary.
            $table->string('section')->nullable();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            // The page this was crawled from, for traceability — not shown to end users.
            $table->string('source_url')->nullable();
            $table->string('external_url')->nullable();
            $table->string('disk')->nullable();
            $table->string('path')->nullable();
            $table->boolean('is_premium')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_no')->default(0);
            $table->timestamps();

            $table->index(['quiz_category_id', 'state_id', 'vehicle_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
