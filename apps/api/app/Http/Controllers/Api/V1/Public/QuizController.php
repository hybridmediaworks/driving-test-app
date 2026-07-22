<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\Quiz\GradeQuizAttempt;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Public\StoreQuizAttemptRequest;
use App\Http\Resources\Api\V1\Public\QuizQuestionResource;
use App\Http\Resources\Api\V1\Public\QuizResource;
use App\Http\Resources\Api\V1\QuizAttemptResource;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class QuizController extends Controller
{
    public function __construct(
        private readonly GradeQuizAttempt $gradeAttempt,
    ) {}

    /**
     * List quizzes
     *
     * Public — no authentication required. Returns only active quizzes, paginated. Optionally
     * filter by `state` (state code, e.g. `CA`), `vehicle_type` (name, e.g. `car`), `category`
     * (name, e.g. `road-signs`), and `quiz_type` (name, e.g. `final` for exam-simulator quizzes).
     * All filters are exact-match and combinable.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Quiz::query()
            ->where('is_active', true)
            ->with(['category', 'quizType', 'state', 'vehicleType'])
            ->orderBy('order_no')
            ->orderBy('title');

        if ($request->filled('state')) {
            $query->whereHas('state', fn ($q) => $q->where('code', $request->string('state')));
        }

        if ($request->filled('vehicle_type')) {
            $query->whereHas('vehicleType', fn ($q) => $q->where('name', $request->string('vehicle_type')));
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('name', $request->string('category')));
        }

        if ($request->filled('quiz_type')) {
            $query->whereHas('quizType', fn ($q) => $q->where('name', $request->string('quiz_type')));
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return QuizResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Show a quiz and its questions
     *
     * Public — no authentication required. Returns 403 if the quiz is inactive. For a premium
     * quiz the caller isn't entitled to attempt, `questions` is omitted entirely and `locked` is
     * `true` — the quiz's existence/metadata (title, question count, cover) still shows as a
     * teaser, but question/answer text never leaves the server for content the caller can't pay
     * for. For an unlocked quiz, questions and their answer options are included, but
     * **`is_correct` and `explanation` are deliberately omitted** on every answer — the client has
     * no way to know the right answer before submitting. Those fields only appear in the response
     * from `storeAttempt` below, after grading, and only for the questions actually answered.
     */
    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('view', $quiz);

        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);
        // This route intentionally carries no auth:sanctum middleware (guests may browse) — that
        // means Gate's ambient/default-guard user resolution never sees the Sanctum token even
        // when one is sent, so the entitled user must be resolved explicitly here.
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('attempt', $quiz);

        if ($unlocked) {
            $quiz->load(['quizQuestions.answers', 'quizQuestions.media']);
        }

        return response()->json([
            'quiz' => new QuizResource($quiz),
            'locked' => ! $unlocked,
            'questions' => $unlocked ? QuizQuestionResource::collection($quiz->quizQuestions) : null,
        ]);
    }

    /**
     * Submit and grade a quiz attempt
     *
     * Works for both guests and logged-in users on this same endpoint — send a Bearer token to
     * attach the attempt to your account, or omit it entirely to submit as a guest (rate-limited
     * to 20 requests/minute per client either way). `answers` does not need to include every
     * question — omitted questions still count toward `total_questions` but are simply not
     * scored. An `answer_id` that doesn't belong to the given `question_id` is silently treated
     * as unanswered/incorrect rather than accepted.
     *
     * Guests: the response's `attempt` is not directly exposed with a `guest_token` field today,
     * but one is generated and stored server-side (from the `guest_token` you send, or a new UUID
     * if omitted) so a future "claim my guest history on signup" flow can use it — not yet built,
     * so there is currently no way to retrieve a guest attempt after this response.
     *
     * The response reveals what `show` above deliberately hid: each answer now includes
     * `is_correct`, `correct_answer_id`, and the question's `explanation`.
     */
    public function storeAttempt(StoreQuizAttemptRequest $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user('sanctum');
        // Same reason as show() above — no auth:sanctum middleware on this route, so the user
        // must be passed explicitly rather than relying on $this->authorize()'s ambient resolution.
        Gate::forUser($user)->authorize('attempt', $quiz);
        $guestToken = $user === null
            ? ($request->string('guest_token')->toString() ?: (string) Str::uuid())
            : null;

        $attempt = ($this->gradeAttempt)(
            $quiz,
            $request->validated('answers'),
            $user?->id,
            $guestToken,
            $request->integer('duration_seconds') ?: null,
        );

        return response()->json(['attempt' => new QuizAttemptResource($attempt)], 201);
    }
}
