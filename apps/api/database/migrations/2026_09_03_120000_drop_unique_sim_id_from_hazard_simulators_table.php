<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `sim_id` turned out NOT to be a safe global dedup key: the source reuses a small pool of ~13
 * generic hazard-perception clips across every state AND both vehicle types (the same sim_id shows
 * up as e.g. "AL Simulator 1", "AK Simulator 1", and again under Motorcycle for both). The original
 * `unique()` on this column let importing a second state/vehicle steal the first's HazardSimulator
 * row and repoint it — see ImportSimulatorsFromCrawl's class docblock. The real dedup key is
 * (already unique) `video_id`; `sim_id` is now purely a traceability field back to the source clip.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hazard_simulators', function (Blueprint $table) {
            $table->dropUnique(['sim_id']);
            $table->index('sim_id');
        });
    }

    public function down(): void
    {
        Schema::table('hazard_simulators', function (Blueprint $table) {
            $table->dropIndex(['sim_id']);
            $table->unique('sim_id');
        });
    }
};
