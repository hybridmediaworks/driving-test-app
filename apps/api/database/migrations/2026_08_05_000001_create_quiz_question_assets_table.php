<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Video/audio deliberately bypass Spatie Media Library — see
     * apps/api/docs/ARCHITECTURE.md "Media": these need a streaming-oriented store
     * (adaptive bitrate/seeking), not a single static download the way question images are.
     * Exactly one of `external_url` or `disk`+`path` should be set per row; the import command
     * enforces that, not a DB constraint, to keep this migration simple.
     */
    public function up(): void
    {
        Schema::create('quiz_question_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_question_id')->constrained('quiz_questions')->cascadeOnDelete();
            $table->string('type');
            $table->string('external_url')->nullable();
            $table->string('disk')->nullable();
            $table->string('path')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['quiz_question_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_question_assets');
    }
};
