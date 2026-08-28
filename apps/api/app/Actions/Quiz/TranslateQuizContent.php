<?php

namespace App\Actions\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\Translation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TranslateQuizContent
{
    public const SUPPORTED_LOCALES = ['es', 'ru'];

    private const LOCALE_NAMES = [
        'es' => 'Spanish',
        'ru' => 'Russian',
    ];

    // Small enough that one batch's translation reliably fits in a single LLM response.
    private const BATCH_SIZE = 15;

    /**
     * Ensures every question (and its answers) on the given quiz has a cached translation for
     * $locale — translating whatever's missing via the LLM and caching it in the generic
     * `translations` table (see HasTranslations). A no-op if the locale isn't supported, the LLM
     * isn't configured, or everything's already cached.
     *
     * Deliberately never throws: translation is an enhancement, not a requirement to take the
     * quiz. Any failure (missing key, network error, malformed LLM response) is logged and
     * swallowed — the caller just keeps serving English for whatever didn't get translated.
     */
    public function __invoke(Quiz $quiz, string $locale): void
    {
        if (! in_array($locale, self::SUPPORTED_LOCALES, true)) {
            return;
        }

        $apiKey = config('services.grok.key');
        if (empty($apiKey)) {
            return;
        }

        $questions = $quiz->quizQuestions()
            ->with(['answers', 'translations' => fn ($q) => $q->where('locale', $locale)])
            ->get();

        $untranslated = $questions->reject(fn (QuizQuestion $q) => $q->translationFor($locale) !== null)->values();
        if ($untranslated->isEmpty()) {
            return;
        }

        foreach ($untranslated->chunk(self::BATCH_SIZE) as $batch) {
            $this->translateBatch($batch->values(), $locale, $apiKey);
        }
    }

    /**
     * @param  Collection<int, QuizQuestion>  $batch
     */
    private function translateBatch(Collection $batch, string $locale, string $apiKey): void
    {
        $languageName = self::LOCALE_NAMES[$locale];

        $payload = $batch->map(fn (QuizQuestion $q) => [
            'id' => $q->id,
            'question_text' => $q->question_text,
            'explanation' => $q->explanation,
            'answers' => $q->answers->map(fn (QuizAnswer $a) => [
                'id' => $a->id,
                'answer_text' => $a->answer_text,
            ])->values()->all(),
        ])->values()->all();

        $system = <<<SYSTEM
        You translate US driving-test quiz content into {$languageName}. Translate ONLY the text
        values (question_text, explanation, answer_text) — never translate, invent, or alter any
        "id" value, and never add, remove, or reorder questions or answers. Keep the meaning
        exact; this is safety-relevant legal/regulatory content, not creative writing. Preserve
        null as null rather than inventing an explanation where none exists.

        Return ONLY valid JSON, no commentary, no markdown fences, matching exactly this shape:
        {"questions": [{"id": number, "question_text": string, "explanation": string|null, "answers": [{"id": number, "answer_text": string}]}]}
        SYSTEM;

        $baseUrl = rtrim((string) config('services.grok.base_url'), '/');

        try {
            $response = Http::withToken($apiKey)
                ->timeout(60)
                ->post($baseUrl.'/chat/completions', [
                    'model' => config('services.grok.model'),
                    'temperature' => 0,
                    'response_format' => ['type' => 'json_object'],
                    // Reasoning models (e.g. openai/gpt-oss-20b on Groq) otherwise spend most/all
                    // of their token budget on hidden reasoning and never emit the JSON body,
                    // which Groq then rejects with json_validate_failed. This is a plain
                    // translation task with no need for deep reasoning, and max_completion_tokens
                    // guarantees room left for the actual output regardless of reasoning length.
                    // Both are no-ops (silently ignored) on models that don't support them.
                    'reasoning_effort' => 'low',
                    'max_completion_tokens' => 8000,
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => json_encode(['questions' => $payload])],
                    ],
                ]);
        } catch (Throwable $e) {
            Log::warning('Quiz translation request failed.', ['locale' => $locale, 'error' => $e->getMessage()]);

            return;
        }

        if (! $response->successful()) {
            Log::warning('Quiz translation request returned an error.', ['locale' => $locale, 'status' => $response->status()]);

            return;
        }

        $decoded = json_decode((string) $response->json('choices.0.message.content', ''), true);
        if (! is_array($decoded) || ! is_array($decoded['questions'] ?? null)) {
            Log::warning('Quiz translation response was not valid JSON in the expected shape.', ['locale' => $locale]);

            return;
        }

        $this->applyTranslatedBatch($batch->keyBy('id'), $decoded['questions'], $locale);
    }

    /**
     * @param  Collection<int, QuizQuestion>  $questionsById
     * @param  array<int, mixed>  $translatedQuestions
     */
    private function applyTranslatedBatch(Collection $questionsById, array $translatedQuestions, string $locale): void
    {
        foreach ($translatedQuestions as $translated) {
            if (! is_array($translated) || ! isset($translated['id'])) {
                continue;
            }

            // Only trust ids we actually sent — never let the model introduce a new id.
            $question = $questionsById->get((int) $translated['id']);
            if (! $question) {
                continue;
            }

            $questionText = $translated['question_text'] ?? null;
            if (! is_string($questionText) || trim($questionText) === '') {
                continue; // never cache an empty/garbled translation
            }

            Translation::query()->updateOrCreate(
                ['translatable_type' => QuizQuestion::class, 'translatable_id' => $question->id, 'locale' => $locale],
                ['fields' => [
                    'question_text' => $questionText,
                    'explanation' => is_string($translated['explanation'] ?? null) ? $translated['explanation'] : null,
                ]],
            );

            $answersById = $question->answers->keyBy('id');
            foreach (($translated['answers'] ?? []) as $translatedAnswer) {
                if (! is_array($translatedAnswer) || ! isset($translatedAnswer['id'])) {
                    continue;
                }

                $answer = $answersById->get((int) $translatedAnswer['id']);
                $answerText = $translatedAnswer['answer_text'] ?? null;
                if (! $answer || ! is_string($answerText) || trim($answerText) === '') {
                    continue;
                }

                Translation::query()->updateOrCreate(
                    ['translatable_type' => QuizAnswer::class, 'translatable_id' => $answer->id, 'locale' => $locale],
                    ['fields' => ['answer_text' => $answerText]],
                );
            }
        }
    }
}
