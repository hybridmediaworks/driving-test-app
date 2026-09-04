<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-keyframe polygon for a moving outline that tracks the object across the clip. Defined now,
 * NOT populated in this build — the crawl states a `frame_count` per hazard but carries no
 * coordinates. Populated only if a future task locates the geometry, at which point the player
 * upgrades from the static `hazards.box` to interpolated keyframes. See §5.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazard_frames', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hazard_id')->constrained('hazards')->cascadeOnDelete();
            $table->decimal('t', 8, 3); // keyframe timestamp, seconds
            $table->json('box'); // {x,y,w,h} or {points:[[x,y]...]}, normalized 0–1
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['hazard_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_frames');
    }
};
