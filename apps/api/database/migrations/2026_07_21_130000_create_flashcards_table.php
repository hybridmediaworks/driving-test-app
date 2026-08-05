<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flashcards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_category_id')->nullable()->constrained('quiz_categories')->restrictOnDelete();
            $table->foreignId('state_id')->nullable()->constrained('states')->restrictOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->constrained('vehicle_types')->restrictOnDelete();
            $table->string('front_text', 500);
            $table->text('back_text');
            $table->string('topic')->nullable();
            $table->boolean('is_premium')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['quiz_category_id', 'state_id', 'vehicle_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flashcards');
    }
};
