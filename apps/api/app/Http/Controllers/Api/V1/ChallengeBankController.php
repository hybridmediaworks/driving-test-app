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

        $items = ChallengeBankItem::query()
            ->where($owner)
            ->with(['question.answers', 'question.assets'])
            ->latest()
            ->get()
            ->filter(fn (ChallengeBankItem $item) => $item->question !== null); // question since deleted

        // Each question carries why it is here, so the vault can list missed and bookmarked
        // separately. A question can be both — got wrong AND saved — and shows in both lists.
        $questions = $items->map(function (ChallengeBankItem $item) {
            $question = $item->question;
            $question->setAttribute('missed', $item->missed);
            $question->setAttribute('bookmarked', $item->bookmarked);

            return $question;
        })->values();

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

        // Marks the question bookmarked, which is its own reason to be in the vault: a question the
        // learner saves stays saved even after they answer it right, and the grader's `missed` flag
        // is left alone on a question that is already there for having been got wrong.
        ChallengeBankItem::mark($owner, collect($validated['question_ids'])->unique()->values()->all(), 'bookmarked');

        return response()->json([
            'count' => ChallengeBankItem::query()->where($owner)->count(),
        ], 201);
    }

    /**
     * Drop a question from the vault entirely — both reasons at once, which is what "remove from my
     * vault" means and what the mobile app's clear-all has always relied on.
     *
     * `?only=bookmarked` clears just that reason instead, for the web quiz screen's bookmark toggle:
     * un-bookmarking a question the learner also got wrong should leave it filed as missed, not quietly
     * wipe it from the list the grader is keeping for them. A no-op (still 200) either way if it was
     * never in their bank.
     */
    public function destroy(Request $request, QuizQuestion $question): JsonResponse
    {
        $request->validate(['only' => ['sometimes', Rule::in(['missed', 'bookmarked'])]]);

        $owner = $this->owner($request);
        if ($owner !== null) {
            $only = $request->string('only')->toString();
            foreach ($only !== '' ? [$only] : ['missed', 'bookmarked'] as $flag) {
                ChallengeBankItem::clear($owner, [$question->id], $flag);
            }
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
