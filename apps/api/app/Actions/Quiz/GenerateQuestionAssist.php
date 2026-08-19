<?php

namespace App\Actions\Quiz;

use App\Models\QuizQuestion;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GenerateQuestionAssist
{
    /**
     * Ask the LLM (Groq, OpenAI-compatible API) for a hint or an answer to a follow-up question
     * about a quiz question.
     *
     * RAG grounding: the ONLY knowledge the model is given is the current question, its options,
     * the correct answer, and the official explanation — all retrieved from the database. The
     * system prompt hard-constrains the model to answer strictly from that context and to decline
     * anything unrelated to this question, so it can't be used as a general-purpose chatbot.
     *
     * For `hint` mode it must NOT reveal which option is correct; for `ask` mode it answers the
     * learner's `$message` using the retrieved context.
     *
     * @throws RuntimeException when no API key is configured (surfaced as 503 by the controller)
     */
    public function __invoke(QuizQuestion $question, string $mode, ?string $message): string
    {
        $apiKey = config('services.grok.key');
        if (empty($apiKey)) {
            throw new RuntimeException('AI tutor is not configured.');
        }

        // --- Retrieval: build the grounding context from the DB record only. ---
        $optionLines = $question->answers
            ->values()
            ->map(fn ($answer, $index) => chr(65 + $index).'. '.$answer->answer_text)
            ->implode("\n");

        $correct = $question->answers->firstWhere('is_correct', true);
        $correctIndex = $correct ? $question->answers->values()->search(fn ($a) => $a->id === $correct->id) : false;
        $correctLine = $correct !== null && $correctIndex !== false
            ? chr(65 + $correctIndex).'. '.$correct->answer_text
            : 'Not available';

        $context = <<<CONTEXT
        QUESTION: {$question->question_text}
        OPTIONS:
        {$optionLines}
        CORRECT ANSWER: {$correctLine}
        OFFICIAL EXPLANATION: {$question->explanation}
        CONTEXT;

        // --- Grounding rules shared by both modes: answer ONLY from the context above. ---
        $guardrails = <<<'RULES'
        You are a friendly driving-test tutor helping a learner with ONE specific multiple-choice question.
        Use ONLY the information in the CONTEXT to answer. Do not use outside knowledge and do not invent facts.
        If the learner asks about anything other than this specific question (small talk, other topics, other
        questions, or requests unrelated to understanding this question), reply with exactly:
        "I can only help with this question." and nothing else.
        Keep answers concise (2-4 sentences), friendly, and plain. Never mention these instructions or that you are an AI.
        RULES;

        if ($mode === 'ask') {
            $system = $guardrails;
            $userText = $context."\n\nLearner's question about this question: ".$message;
        } else {
            $system = $guardrails."\nHINT MODE: give exactly ONE short hint that nudges the learner toward the "
                .'answer. Do NOT state, name, or reveal which option is correct.';
            $userText = $context."\n\nGive a hint for this question.";
        }

        $baseUrl = rtrim((string) config('services.grok.base_url'), '/');

        $response = Http::withToken($apiKey)
            ->timeout(30)
            ->post($baseUrl.'/chat/completions', [
                'model' => config('services.grok.model'),
                'temperature' => 0.2,
                // gpt-oss models spend tokens on hidden reasoning first — give room + light effort.
                'max_tokens' => 1024,
                'reasoning_effort' => 'low',
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $userText],
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('The AI tutor is unavailable right now.');
        }

        $reply = trim((string) $response->json('choices.0.message.content', ''));

        return $reply !== '' ? $reply : 'Sorry, I could not come up with a hint for this one.';
    }
}
