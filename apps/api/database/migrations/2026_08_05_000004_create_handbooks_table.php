<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One handbook per state x vehicle_type (Car/CDL/Motorcycle each have their own real driver's
     * manual, own PDF, own source page — confirmed against real crawled data, which is why this
     * isn't a single handbook_url column on states). Real chapter/section text is stored (not just
     * a PDF link) so it can ground the AI Tutor's retrieval later, the same way
     * cheat_sheet_sections already will per docs/CONTENT_LIBRARY_ROADMAP.md.
     */
    public function up(): void
    {
        Schema::create('handbooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('state_id')->constrained('states')->restrictOnDelete();
            $table->foreignId('vehicle_type_id')->constrained('vehicle_types')->restrictOnDelete();
            $table->string('language')->default('english');
            $table->string('title');
            $table->string('source_url')->nullable();
            $table->unsignedInteger('total_words')->nullable();
            $table->timestamps();

            $table->unique(['state_id', 'vehicle_type_id', 'language']);
        });

        Schema::create('handbook_chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('handbook_id')->constrained('handbooks')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['handbook_id', 'sort_order']);
        });

        Schema::create('handbook_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('handbook_chapter_id')->constrained('handbook_chapters')->cascadeOnDelete();
            // Nullable — the real data has sections with no heading (just a content block).
            $table->string('heading')->nullable();
            $table->longText('content');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['handbook_chapter_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('handbook_sections');
        Schema::dropIfExists('handbook_chapters');
        Schema::dropIfExists('handbooks');
    }
};
