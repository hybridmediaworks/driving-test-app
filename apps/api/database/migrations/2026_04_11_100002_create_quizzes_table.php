<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_category_id')->constrained('quiz_categories')->restrictOnDelete();
            $table->foreignId('quiz_type_id')->constrained('quiz_types')->restrictOnDelete();
            $table->foreignId('state_id')->constrained('states')->restrictOnDelete();
            $table->foreignId('vehicle_type_id')->constrained('vehicle_types')->restrictOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('test_track')->default('permit_test');
            $table->unsignedInteger('order_no')->default(0);
            $table->unsignedInteger('total_questions')->default(0);
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedTinyInteger('passing_score_percent')->nullable();
            $table->boolean('is_premium')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['quiz_category_id', 'quiz_type_id']);
            $table->index(['state_id', 'vehicle_type_id', 'test_track']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
