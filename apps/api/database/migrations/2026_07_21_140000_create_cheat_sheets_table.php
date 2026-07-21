<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cheat_sheets', function (Blueprint $table) {
            $table->id();
            // Nullable: a sheet can be state-agnostic ("Top 20 Trickiest Questions") or cross-
            // category ("federal road-sign meanings") — same "null = applies universally"
            // convention already used on flashcards.
            $table->foreignId('quiz_category_id')->nullable()->constrained('quiz_categories')->restrictOnDelete();
            $table->foreignId('state_id')->nullable()->constrained('states')->restrictOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->constrained('vehicle_types')->restrictOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('summary', 500);
            $table->boolean('is_premium')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_no')->default(0);
            $table->timestamps();

            $table->index(['quiz_category_id', 'state_id', 'vehicle_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cheat_sheets');
    }
};
