<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When a simulator's content is locked, staff have taken over its hazard layer: the content
 * importer skips it entirely on re-import (see ImportSimulatorsFromCrawl::importHazardLayer), so
 * manual edits and staff-added hazards are permanent. Unlocking hands authority back to the crawl.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hazard_simulators', function (Blueprint $table) {
            $table->boolean('content_locked')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('hazard_simulators', function (Blueprint $table) {
            $table->dropColumn('content_locked');
        });
    }
};
