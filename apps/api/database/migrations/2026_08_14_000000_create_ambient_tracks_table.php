<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Background-music loops offered in the quiz Settings panel. `quiz_category_id` nullable
     * means "global" — shown for every quiz regardless of category — same nullable-FK-scoping
     * convention as videos/cheat_sheets. external_url/disk+path mirrors videos for the same
     * reason: no in-app upload flow for the audio file itself.
     */
    public function up(): void
    {
        Schema::create('ambient_tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_category_id')->nullable()->constrained('quiz_categories')->restrictOnDelete();
            $table->string('title');
            $table->string('external_url')->nullable();
            $table->string('disk')->nullable();
            $table->string('path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_no')->default(0);
            $table->timestamps();

            $table->index('quiz_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ambient_tracks');
    }
};
