<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cheat_sheet_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cheat_sheet_id')->constrained('cheat_sheets')->cascadeOnDelete();
            $table->string('heading');
            $table->text('body_markdown');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['cheat_sheet_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cheat_sheet_sections');
    }
};
