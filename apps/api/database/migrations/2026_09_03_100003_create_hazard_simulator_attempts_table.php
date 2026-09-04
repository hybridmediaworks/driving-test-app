<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One hazard-perception run. Mirrors `quiz_attempts` — same guest_token / claim-on-register model,
 * same "persist the graded outcome, never derive it on read" rule. `hazard_simulator_id` is
 * restrictOnDelete so deleting a simulator can't quietly erase learners' history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazard_simulator_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_token', 64)->nullable();
            $table->foreignId('hazard_simulator_id')->constrained('hazard_simulators')->restrictOnDelete();
            $table->string('status')->default('in_progress'); // in_progress | completed | abandoned
            $table->unsignedTinyInteger('score')->nullable(); // 0–100 composite Hazard Score
            // Persisted at grade time vs the threshold then in effect. Null = not applicable
            // (score-only simulator).
            $table->boolean('passed')->nullable();
            $table->unsignedInteger('hazards_spotted')->default(0);
            $table->unsignedInteger('hazards_total')->default(0); // snapshotted at attempt time
            $table->unsignedInteger('avg_reaction_ms')->nullable();
            $table->string('reaction_band')->nullable(); // fast | average | slow
            $table->unsignedInteger('false_clicks')->default(0);
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('guest_token');
            $table->index(['hazard_simulator_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_simulator_attempts');
    }
};
