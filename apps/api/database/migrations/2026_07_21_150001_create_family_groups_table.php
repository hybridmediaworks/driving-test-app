<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_groups', function (Blueprint $table) {
            $table->id();
            // restrictOnDelete, not cascade — matches quiz_attempts.quiz_id's precedent: deleting
            // a user who owns a paid household must not silently destroy the other members' access.
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('plan_id')->constrained('plans')->restrictOnDelete();
            $table->string('stripe_payment_intent_id')->nullable()->unique();
            // Snapshot of plans.max_seats at purchase time — a later admin edit to the plan must
            // not retroactively change how many seats an already-purchased household has.
            $table->unsignedTinyInteger('max_seats');
            $table->string('status')->default('active');
            $table->timestamp('purchased_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_groups');
    }
};
