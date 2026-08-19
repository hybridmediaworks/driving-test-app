<?php

namespace App\Actions\Quiz;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Support\Facades\Http;
use Throwable;

class GenerateResultsInsight
{
    /**
     * Produce the results-screen "weak areas" + a short, dynamic coach message.
     *
     * The weak areas are grounded on the topics of the questions the learner actually got wrong.
     * When a Groq key is configured, the LLM turns those into tidy labels and writes a fun,
     * personalised one-liner; otherwise (or on any failure) it falls back to the distinct wrong
     * topics + a score-based template message, so the results screen always has something to show.
     *
     * @param  list<int>  $wrongQuestionIds
     * @return array{weak_areas: list<string>, message: string}
     */
    public function __invoke(Quiz $quiz, int $correct, int $total, array $wrongQuestionIds): array
    {
        $percent = $total > 0 ? (int) round($correct / $total * 100) : 0;

        $wrong = QuizQuestion::query()
            ->where('quiz_id', $quiz->id)
            ->whereIn('id', $wrongQuestionIds)
            ->get(['id', 'topic', 'question_text']);

        /** @var list<string> $topics */
        $topics = $wrong->pluck('topic')->filter()->unique()->values()->take(4)->all();

        $apiKey = config('services.grok.key');
        if (empty($apiKey)) {
            return ['weak_areas' => $topics, 'message' => $this->fallbackMessage($percent)];
        }

        $missed = $wrong->isEmpty()
            ? '(none, the learner answered every question correctly)'
            : $wrong->map(fn ($q) => '- ['.($q->topic ?? 'General').'] '.$q->question_text)->implode("\n");

        $system = <<<'SYS'
        You are a friendly, upbeat driving-test coach. Reply with STRICT JSON only, no prose outside it:
        {"weak_areas": [up to 4 short Title Case topic labels the learner should review, [] if none], "message": "one short, fun, encouraging 1-2 sentence message about their result"}
        Base weak_areas ONLY on the missed questions provided. Keep the message light and specific to how they did.
        Use plain ASCII punctuation only: never use em dashes or en dashes; use commas or periods instead.
        SYS;

        $user = "Score: {$correct}/{$total} ({$percent}%).\nMissed questions:\n{$missed}";

        try {
            $baseUrl = rtrim((string) config('services.grok.base_url'), '/');
            $response = Http::withToken($apiKey)
                ->timeout(30)
                ->post($baseUrl.'/chat/completions', [
                    'model' => config('services.grok.model'),
                    'temperature' => 0.5,
                    // gpt-oss models spend tokens on hidden reasoning before the answer — give room
                    // and keep reasoning light so the JSON body finishes within budget.
                    'max_tokens' => 1024,
                    'reasoning_effort' => 'low',
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $user],
                    ],
                ]);

            if (! $response->successful()) {
                return ['weak_areas' => $topics, 'message' => $this->fallbackMessage($percent)];
            }

            $parsed = json_decode((string) $response->json('choices.0.message.content', ''), true);

            $weak = is_array($parsed['weak_areas'] ?? null)
                ? array_values(array_map(fn ($a) => $this->clean($a), array_slice(array_filter($parsed['weak_areas'], 'is_string'), 0, 4)))
                : $topics;
            $message = is_string($parsed['message'] ?? null) && trim($parsed['message']) !== ''
                ? $this->clean($parsed['message'])
                : $this->fallbackMessage($percent);

            return ['weak_areas' => $weak, 'message' => $message];
        } catch (Throwable) {
            return ['weak_areas' => $topics, 'message' => $this->fallbackMessage($percent)];
        }
    }

    private function fallbackMessage(int $percent): string
    {
        return match (true) {
            $percent === 100 => 'Flawless run, you nailed every question. You look test-ready!',
            $percent >= 80 => "Nicely done, you're above the passing line. Keep the momentum going.",
            $percent >= 50 => "Solid effort. Review the ones you missed and you'll be over the line in no time.",
            default => 'Every expert started here. Go over the missed rules and give it another run.',
        };
    }

    /**
     * Strip the fancy dashes LLMs love (em, en, figure dash, horizontal bar) that the product voice
     * never uses, collapsing each (and any surrounding spaces) to a plain comma.
     */
    private function clean(string $text): string
    {
        $text = preg_replace('/\s*[\x{2012}-\x{2015}]\s*/u', ', ', $text);

        return trim((string) $text, " ,\t\n\r\0\x0B");
    }
}
