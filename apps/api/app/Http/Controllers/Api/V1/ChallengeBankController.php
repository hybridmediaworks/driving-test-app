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
     * List the current user's Challenge Bank questions (newest first), with answers + assets so the
     * client can re-practice them right away. Explanation is withheld until an answer is checked,
     * same as a normal quiz. Each question carries its `quiz_id` so the client can grade answers
     * against the existing `POST /quizzes/{quiz}/questions/{question}/check` endpoint.
     */
    public function index(Request $request): JsonResponse
    {
        $questions = $request->user()->challengeBankItems()
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

        $userId = $request->user()->id;
        $now = now();
        $rows = collect($validated['question_ids'])->unique()->map(fn ($id) => [
            'user_id' => $userId,
            'quiz_question_id' => $id,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        // insertOrIgnore relies on the unique(user_id, quiz_question_id) index to skip duplicates.
        ChallengeBankItem::query()->insertOrIgnore($rows);

        return response()->json([
            'count' => $request->user()->challengeBankItems()->count(),
        ], 201);
    }

    /**
     * Remove a question from the Challenge Bank — called once the learner answers it correctly.
     * A no-op (still 200) if it wasn't in their bank.
     */
    public function destroy(Request $request, QuizQuestion $question): JsonResponse
    {
        $request->user()->challengeBankItems()
            ->where('quiz_question_id', $question->id)
            ->delete();

        return response()->json([
            'count' => $request->user()->challengeBankItems()->count(),
        ]);
    }
}
