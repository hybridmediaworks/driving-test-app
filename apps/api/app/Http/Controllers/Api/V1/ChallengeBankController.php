<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\ChallengeBankQuestionResource;
use App\Models\ChallengeBankItem;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChallengeBankController extends Controller
{
    /**
     * List the caller's Challenge Bank questions (newest first), with answers + assets so the
     * client can re-practice them right away. Explanation is withheld until an answer is checked,
     * same as a normal quiz. Each question carries its `quiz_id` so the client can grade answers
     * against the existing `POST /quizzes/{quiz}/questions/{question}/check` endpoint.
     *
     * Works for signed-in users (scoped by user_id via the Bearer token) and signed-out guests
     * alike (scoped by the `X-Guest-Token` this install has been sending) — a caller with neither
     * identity just gets an empty bank.
     */
    public function index(Request $request): JsonResponse
    {
        $owner = $this->owner($request);
        if ($owner === null) {
            return response()->json(['data' => []]);
        }

        $questions = ChallengeBankItem::query()
            ->where($owner)
            ->with(['question.answers', 'question.assets'])
            ->latest()
            ->get()
            ->pluck('question')
            ->filter() // drop any whose underlying question was deleted
            ->values();

        return response()->json([
            'data' => ChallengeBankQuestionResource::collection($questions),
        ]);
    }

    /**
     * Add one or more questions to the Challenge Bank. Idempotent — re-adding an existing question
     * is a no-op (unique constraint). The grader adds wrong answers automatically; this endpoint
     * backs the manual "add to Challenge Bank" action from the quiz menu.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question_ids' => ['required', 'array', 'min:1'],
            'question_ids.*' => ['integer', Rule::exists('quiz_questions', 'id')],
        ]);

        $owner = $this->owner($request);
        if ($owner === null) {
            return response()->json(['message' => 'No caller identity — sign in or send an X-Guest-Token.'], 422);
        }

        $now = now();
        $rows = collect($validated['question_ids'])->unique()->map(fn ($id) => [
            ...$owner,
            'quiz_question_id' => $id,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        // insertOrIgnore relies on the unique(user_id|guest_token, quiz_question_id) index to skip
        // duplicates.
        ChallengeBankItem::query()->insertOrIgnore($rows);

        return response()->json([
            'count' => ChallengeBankItem::query()->where($owner)->count(),
        ], 201);
    }

    /**
     * Remove a question from the Challenge Bank — called once the learner answers it correctly.
     * A no-op (still 200) if it wasn't in their bank.
     */
    public function destroy(Request $request, QuizQuestion $question): JsonResponse
    {
        $owner = $this->owner($request);
        if ($owner !== null) {
            ChallengeBankItem::query()
                ->where($owner)
                ->where('quiz_question_id', $question->id)
                ->delete();
        }

        return response()->json([
            'count' => $owner !== null ? ChallengeBankItem::query()->where($owner)->count() : 0,
        ]);
    }

    /**
     * The caller's Challenge Bank ownership scope: keyed by user_id for a signed-in learner (Bearer
     * token), or guest_token for a guest (`X-Guest-Token` header, or the legacy `guest_token` body
     * field). Doubles as the where()/insert column pair. Null when the caller has neither identity.
     *
     * @return array{user_id: int}|array{guest_token: string}|null
     */
    private function owner(Request $request): ?array
    {
        $user = $request->user('sanctum');
        if ($user !== null) {
            return ['user_id' => $user->id];
        }

        $token = $request->header('X-Guest-Token') ?: $request->input('guest_token');

        return is_string($token) && $token !== '' ? ['guest_token' => $token] : null;
    }
}
