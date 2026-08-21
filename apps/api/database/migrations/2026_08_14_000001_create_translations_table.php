<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Generic, polymorphic machine-translation cache — any model can opt in via the
     * HasTranslations trait rather than needing its own dedicated `_translations` table. One row
     * per (translatable model, locale); `fields` holds whatever text fields that model type
     * translates (e.g. `{"question_text": "...", "explanation": "..."}` for a QuizQuestion),
     * so adding a new translatable model (flashcards, cheat sheets, videos, ...) later needs no
     * schema change, just the trait plus deciding which of its fields to translate.
     *
     * Populated on demand, not pre-translated — see App\Actions\Quiz\TranslateQuizContent for
     * the quiz-question/answer case.
     */
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('translatable_type');
            $table->unsignedBigInteger('translatable_id');
            $table->string('locale', 10);
            $table->json('fields');
            $table->timestamps();

            $table->unique(['translatable_type', 'translatable_id', 'locale'], 'translations_morph_locale_unique');
            $table->index(['translatable_type', 'translatable_id'], 'translations_morph_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
