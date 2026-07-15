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
            $table->foreignId('quiz_category_id')->constrained('quiz_categories')->cascadeOnDelete();
            $table->foreignId('quiz_type_id')->constrained('quiz_types')->restrictOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->unsignedInteger('total_questions')->default(0);
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->boolean('is_premium')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['quiz_category_id', 'quiz_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
