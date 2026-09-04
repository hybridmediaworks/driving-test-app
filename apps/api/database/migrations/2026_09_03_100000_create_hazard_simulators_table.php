<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The interactive hazard-perception layer sitting 1:1 on top of a `videos` row. The video keeps
 * carrying the catalog identity (title, thumbnail, duration, premium, state/vehicle, section);
 * this table adds only what the exercise itself needs. See docs/HAZARD_PERCEPTION_SIMULATOR.md §5.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazard_simulators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->unique()->constrained('videos')->cascadeOnDelete();
            // Its own slug (generated from the video title) so the player route can bind by slug
            // without leaking the numeric id, and stays stable if the video is retitled.
            $table->string('slug')->unique();
            // Source `sim_id` — the idempotent re-import key and a traceability handle back to the
            // crawl. Nullable for staff-created simulators that never came from a crawl.
            $table->unsignedBigInteger('sim_id')->nullable()->unique();
            $table->unsignedBigInteger('page_id')->nullable();
            // Playback source — lets a later switch to self-hosted HLS be a config change, not a
            // schema migration. `vimeo` now; `mux` / `cloudflare` / `file` later.
            $table->string('provider')->default('vimeo');
            $table->string('provider_video_id')->nullable();
            $table->string('test_level')->nullable();
            $table->string('test_location')->nullable();
            $table->string('test_number')->nullable();
            // Scored count = count(timeline). Snapshotted here so a listing needn't join hazards.
            $table->unsignedInteger('hazard_count')->default(0);
            // From the source; reconciled against the actual `mode = demo` rows at import time,
            // mismatch logged as a data-quality warning (never fails the import).
            $table->unsignedInteger('demo_hazard_count')->default(0);
            // Product value — the source has none. Null = score-only, no pass/fail shown (§15 D6).
            $table->unsignedTinyInteger('pass_threshold_percent')->nullable();
            // Names a weights/bands set in config/hazard.php so tuning isn't a code rewrite.
            $table->string('scoring_profile')->default('standard');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_simulators');
    }
};
