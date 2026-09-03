<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-click / per-resolution record for one attempt — mirrors `quiz_attempt_answers`. The client
 * submits the raw click log; `GradeHazardAttempt` writes one row per resolved event (a spotted
 * hazard, a missed hazard, or a false click) so a run can be reviewed and audited afterwards.
 *
 * Foreign-key and index names are given explicitly (`hsae_*`) — the convention-generated names
 * blow past MySQL's 64-char identifier limit on a table this deeply namespaced.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazard_simulator_attempt_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hazard_simulator_attempt_id');
            // Null = a false click that landed in no hazard window.
            $table->foreignId('hazard_id')->nullable();
            $table->string('kind'); // hit | miss | false_click
            $table->unsignedInteger('clicked_at_video_ms')->nullable();
            // clicked − time_start·1000, clamped to the window. Hits only.
            $table->unsignedInteger('reaction_ms')->nullable();
            $table->decimal('pointer_x', 6, 4)->nullable(); // normalized 0–1 — QA heatmap + anti-cheat
            $table->decimal('pointer_y', 6, 4)->nullable();
            $table->timestamps();

            $table->foreign('hazard_simulator_attempt_id', 'hsae_attempt_fk')
                ->references('id')->on('hazard_simulator_attempts')->cascadeOnDelete();
            $table->foreign('hazard_id', 'hsae_hazard_fk')
                ->references('id')->on('hazards')->nullOnDelete();

            $table->index('hazard_simulator_attempt_id', 'hsae_attempt_idx');
            $table->index('hazard_id', 'hsae_hazard_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_simulator_attempt_events');
    }
};
