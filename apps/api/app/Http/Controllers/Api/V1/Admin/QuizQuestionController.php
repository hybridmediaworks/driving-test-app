<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Quiz\CreateQuizQuestion;
use App\Actions\Quiz\UpdateQuizQuestion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\MoveQuizQuestionRequest;
use App\Http\Requests\Api\V1\Admin\ReorderQuizQuestionsRequest;
use App\Http\Requests\Api\V1\Admin\StoreQuizQuestionRequest;
use App\Http\Requests\Api\V1\Admin\UpdateQuizQuestionRequest;
use App\Http\Resources\Api\V1\Admin\QuizQuestionResource;
use App\Http\Resources\Api\V1\Admin\QuizResource;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizQuestionController extends Controller
{
    public function __construct(
        private readonly CreateQuizQuestion $createQuestion,
        private readonly UpdateQuizQuestion $updateQuestion,
    ) {}

    /**
     * List a quiz's questions (admin)
     *
     * Requires an admin account. Includes each question's answers, ordered by sort_order.
     * `questions` uses the standard Laravel Resource collection envelope (`data`/`links`/`meta`).
     */
    public function index(Request $request, Quiz $quiz): JsonResponse
    {
        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);

        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $questions = $quiz->quizQuestions()
            ->with('answers')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'quiz' => new QuizResource($quiz),
            'questions' => QuizQuestionResource::collection($questions)->response()->getData(true),
        ]);
    }

    /**
     * Create a question on a quiz (admin)
     *
     * Multipart request. `answers` is a bracket-keyed array (`answers[0][answer_text]`, etc.),
     * min 2 / max 12 options, and **exactly one** must have `is_correct=true` — enforced at
     * validation, not just convention. `images[]` accepts up to 10 files, max 5MB each.
     */
    public function store(StoreQuizQuestionRequest $request, Quiz $quiz): JsonResponse
    {
        $validated = $request->safe()->except(['images']);
        $answers = $validated['answers'];
        unset($validated['answers']);

        $question = ($this->createQuestion)($quiz, $validated, $answers, $request->file('images', []));

        return response()->json(['question' => new QuizQuestionResource($question)], 201);
    }

    /**
     * Show a question (admin)
     */
    public function show(Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);
        $question->load(['answers', 'media']);

        return response()->json([
            'quiz' => new QuizResource($quiz),
            'question' => new QuizQuestionResource($question),
        ]);
    }

    /**
     * Update a question (admin)
     *
     * Multipart request (send as POST with `_method=PUT`). `answers` fully replaces the existing
     * answer set (same one-correct-answer rule as create). Existing images are **kept only if
     * their media ID is included in `keep_media_ids`** — a JSON-encoded array of integers sent as
     * a single string form field, e.g. `keep_media_ids=[3,5]`. Any existing image whose ID is
     * omitted is deleted; new files go in `images[]` same as create. Max 10 images total
     * (kept + new combined) is enforced.
     */
    public function update(UpdateQuizQuestionRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        $validated = $request->safe()->except(['images', 'keep_media_ids']);
        $answers = $validated['answers'];
        unset($validated['answers']);

        $question = ($this->updateQuestion)(
            $quiz,
            $question,
            $validated,
            $answers,
            $request->file('images', []),
            $request->keepMediaIds(),
        );

        return response()->json(['question' => new QuizQuestionResource($question)]);
    }

    /**
     * Delete a question (admin)
     *
     * Also deletes its answers and images, and re-syncs the parent quiz's `total_questions`.
     * Unlike quizzes, there is no attempt-history guard here — deleting a question that's already
     * been answered in past attempts will leave those attempt-answer rows without a live question
     * to reference (cascade-deleted alongside it).
     */
    public function destroy(Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        $question->delete();
        $quiz->syncTotalQuestions();

        return response()->json(['message' => __('Question deleted.')]);
    }

    /**
     * Reorder all of a quiz's questions (admin)
     *
     * `order` is the full, complete list of question IDs in their new sequence — this replaces
     * `sort_order` for every question in one call, not just the ones that moved.
     */
    public function reorder(ReorderQuizQuestionsRequest $request, Quiz $quiz): JsonResponse
    {
        $ids = $request->validated('order');

        DB::transaction(function () use ($quiz, $ids): void {
            foreach ($ids as $index => $id) {
                QuizQuestion::query()
                    ->where('quiz_id', $quiz->id)
                    ->whereKey($id)
                    ->update(['sort_order' => $index]);
            }
        });

        return response()->json(['message' => __('Question order updated.')]);
    }

    /**
     * Move a single question up or down one position (admin)
     *
     * Swaps this question with its immediate neighbor in the given `direction`. A no-op (still
     * 200) if already at that end of the list — use `reorder` above instead for moving something
     * more than one position at a time.
     */
    public function move(MoveQuizQuestionRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->assertQuestionBelongsToQuiz($quiz, $question);

        $direction = $request->validated('direction');
        $orderedIds = $quiz->quizQuestions()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $idx = array_search($question->id, $orderedIds, true);
        if ($idx === false) {
            abort(404);
        }

        $swapIdx = $direction === 'up' ? $idx - 1 : $idx + 1;
        if ($swapIdx < 0 || $swapIdx >= count($orderedIds)) {
            return response()->json(['message' => __('Question order updated.')]);
        }

        $newOrder = $orderedIds;
        [$newOrder[$idx], $newOrder[$swapIdx]] = [$newOrder[$swapIdx], $newOrder[$idx]];

        DB::transaction(function () use ($quiz, $newOrder): void {
            foreach ($newOrder as $index => $id) {
                QuizQuestion::query()
                    ->where('quiz_id', $quiz->id)
                    ->whereKey($id)
                    ->update(['sort_order' => $index]);
            }
        });

        return response()->json(['message' => __('Question order updated.')]);
    }

    private function assertQuestionBelongsToQuiz(Quiz $quiz, QuizQuestion $question): void
    {
        if ($question->quiz_id !== $quiz->id) {
            abort(404);
        }
    }
}
