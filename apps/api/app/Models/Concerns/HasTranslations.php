<?php

namespace App\Models\Concerns;

use App\Models\Translation;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Opts a model into the generic polymorphic translation cache (see the `translations` table).
 * Add this trait to any model with text fields worth machine-translating — it doesn't decide
 * which fields those are or when to populate them; that's the caller's job (e.g.
 * App\Actions\Quiz\TranslateQuizContent for QuizQuestion/QuizAnswer).
 */
trait HasTranslations
{
    /**
     * @return MorphMany<Translation, $this>
     */
    public function translations(): MorphMany
    {
        return $this->morphMany(Translation::class, 'translatable');
    }

    /**
     * The cached translation for one locale, if this model has been translated into it yet.
     */
    public function translationFor(string $locale): ?Translation
    {
        return $this->relationLoaded('translations')
            ? $this->translations->firstWhere('locale', $locale)
            : $this->translations()->where('locale', $locale)->first();
    }
}
