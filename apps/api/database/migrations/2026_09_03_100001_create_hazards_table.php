<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per `hazards[]` entry from the crawl — the WHOLE pool, not just the scored `timeline[]`
 * subset (`in_timeline` flags which are scored). Timings + comment + narration + category live
 * here; the moving per-frame geometry (if ever sourced) goes in `hazard_frames`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hazard_simulator_id')->constrained('hazard_simulators')->cascadeOnDelete();
            // Source `id`, unique within a simulator — the idempotent upsert key on re-import.
            $table->unsignedBigInteger('source_hazard_id')->nullable();
            // Verbatim source `type`, kept for staff reclassification when `type` had to fall back.
            $table->string('type_raw')->nullable();
            $table->string('type')->default('vehicle');
            $table->unsignedInteger('hazard_group')->nullable();
            $table->string('mode')->default('assessment'); // demo | assessment
            $table->boolean('in_timeline')->default(false);
            // Position within the scored timeline; null for pool-only hazards.
            $table->unsignedInteger('sort_order')->nullable();
            $table->decimal('time_start', 8, 3)->default(0);
            $table->decimal('time_end', 8, 3)->default(0);
            $table->unsignedInteger('frame_count')->default(0);
            // Static highlighted region {x,y,w,h} normalized 0–1. Null → the player draws a
            // category-based fallback zone (HazardType::defaultZone). This is what the player uses.
            $table->json('box')->nullable();
            $table->text('comment')->nullable();
            // Narration MP3 — external URL now (Media-Library bypass rule), re-hostable later via
            // disk + path without touching callers.
            $table->string('audio_url')->nullable();
            $table->string('audio_disk')->nullable();
            $table->string('audio_path')->nullable();
            $table->timestamps();

            $table->unique(['hazard_simulator_id', 'source_hazard_id']);
            $table->index(['hazard_simulator_id', 'in_timeline']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazards');
    }
};
