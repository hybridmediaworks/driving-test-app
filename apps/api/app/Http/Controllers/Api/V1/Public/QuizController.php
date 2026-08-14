<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\Quiz\ComputeAnswerPopularity;
use App\Actions\Quiz\GenerateQuestionAssist;
use App\Actions\Quiz\GradeQuizAttempt;
use App\Actions\Quiz\GradeSingleAnswer;
use App\Actions\Quiz\TranslateQuizContent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Public\CheckQuizAnswerRequest;
use App\Http\Requests\Api\V1\Public\QuizAssistRequest;
use App\Http\Requests\Api\V1\Public\StoreQuizAttemptRequest;
use App\Http\Requests\Api\V1\Public\StoreQuizQuestionReportRequest;
use App\Http\Resources\Api\V1\Public\QuizQuestionResource;
use App\Http\Resources\Api\V1\Public\QuizResource;
use App\Http\Resources\Api\V1\QuizAttemptResource;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionReport;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class QuizController extends Controller
{
    public function __construct(
        private readonly GradeQuizAttempt $gradeAttempt,
        private readonly GradeSingleAnswer $gradeSingleAnswer,
        private readonly GenerateQuestionAssist $generateAssist,
        private readonly ComputeAnswerPopularity $computePopularity,
        private readonly TranslateQuizContent $translateQuizContent,
    ) {}

    /**
     * List quizzes
     *
     * Public — no authentication required. Returns only active quizzes, paginated. Optionally
     * filter by `state` (state code, e.g. `CA`), `vehicle_type` (name, e.g. `car`), `category`
     * (name, e.g. `road-signs`), `quiz_type` (name, e.g. `final` for exam-simulator quizzes), and
     * `test_track` (`permit_test` or `driving_test`), and `slug` (exact match — lets a client
     * resolve `state` + `vehicle_type` + `slug` to a quiz id without a separate lookup route).
     * All filters are exact-match and combinable.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Quiz::query()
            ->where('is_active', true)
            ->with(['category', 'quizType', 'state', 'vehicleType'])
            ->orderBy('is_premium')
            ->orderBy('order_no')
            ->orderBy('title');

        if ($request->filled('slug')) {
            $query->where('slug', $request->string('slug'));
        }

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

        if ($request->filled('test_track')) {
            $query->where('test_track', $request->string('test_track'));
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
     *
     * Optional `language` (`es`/`ru`) machine-translates the question/answer text, cached after
     * the first request for a given quiz+language (see TranslateQuizContent) — later requests are
     * instant, but the first one for a not-yet-seen quiz+language pair blocks on the translation.
     * `content_language` in the response reports what was actually served: `en` whenever
     * translation wasn't available/configured or failed, even if a non-English `language` was
     * requested — the quiz is still fully usable, just not in that language yet.
     */
    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('view', $quiz);

        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);
        // This route intentionally carries no auth:sanctum middleware (guests may browse) — that
        // means Gate's ambient/default-guard user resolution never sees the Sanctum token even
        // when one is sent, so the entitled user must be resolved explicitly here.
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('attempt', $quiz);

        $contentLanguage = 'en';

        if ($unlocked) {
            $requestedLocale = $request->filled('language') ? $request->string('language')->toString() : null;
            $translating = $requestedLocale !== null && $requestedLocale !== 'en';

            // TranslateQuizContent queries quizQuestions itself (via the relation query builder,
            // not the loaded collection), so it's safe to call before the load() below.
            if ($translating) {
                ($this->translateQuizContent)($quiz, $requestedLocale);
            }

            // A single load() call — calling load() twice (once for answers/media/assets, again
            // for translations) would re-fetch quizQuestions fresh the second time and silently
            // drop whatever wasn't re-specified in that second call.
            $quiz->load([
                'quizQuestions.answers',
                'quizQuestions.media',
                'quizQuestions.assets',
                ...($translating ? [
                    'quizQuestions.translations' => fn ($q) => $q->where('locale', $requestedLocale),
                    'quizQuestions.answers.translations' => fn ($q) => $q->where('locale', $requestedLocale),
                ] : []),
            ]);

            if ($translating && $this->applyContentLanguage($quiz->quizQuestions, $requestedLocale)) {
                $contentLanguage = $requestedLocale;
            }
        }

        return response()->json([
            'quiz' => new QuizResource($quiz),
            'locked' => ! $unlocked,
            'questions' => $unlocked ? QuizQuestionResource::collection($quiz->quizQuestions) : null,
            'content_language' => $contentLanguage,
        ]);
    }

    /**
     * Overlays cached translations (already eager-loaded, locale-filtered) onto the in-memory
     * question/answer models before serialization — never persisted, just swaps what gets
     * serialized for this one response. Returns whether at least one question actually had a
     * cached translation applied, so the caller can report the real served language rather than
     * just echoing back whatever was requested.
     *
     * @param  EloquentCollection<int, QuizQuestion>  $questions
     */
    private function applyContentLanguage(EloquentCollection $questions, string $locale): bool
    {
        $anyApplied = false;

        foreach ($questions as $question) {
            $translation = $question->translationFor($locale);
            if ($translation) {
                $question->question_text = $translation->fields['question_text'] ?? $question->question_text;
                $question->explanation = $translation->fields['explanation'] ?? $question->explanation;
                $anyApplied = true;
            }

            foreach ($question->answers as $answer) {
                $answerTranslation = $answer->translationFor($locale);
                if ($answerTranslation) {
                    $answer->answer_text = $answerTranslation->fields['answer_text'] ?? $answer->answer_text;
                }
            }
        }

        return $anyApplied;
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

    /**
     * Grade a single answer for instant feedback
     *
     * Powers the practice-mode reveal: as soon as a learner picks an option, the client posts it
     * here and gets back whether it was right, the correct answer id, the question's
     * explanation, and how popular each option was among everyone who has completed this quiz
     * (`answer_popularity`, null until at least one attempt has been submitted). Same
     * guest-or-sanctum entitlement gate as attempts. Unlike `show`, this deliberately exposes the
     * answer — but only for the one question the learner just committed to.
     *
     * Optional `language` (`es`/`ru`) returns the explanation translated — but only from whatever
     * `show` already cached for this quiz+language; unlike `show`, this endpoint never triggers a
     * fresh translation itself (an answer submission shouldn't have to wait on an LLM call), so it
     * silently falls back to English if the quiz was never viewed in that language first.
     */
    public function checkAnswer(CheckQuizAnswerRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        Gate::forUser($request->user('sanctum'))->authorize('attempt', $quiz);

        if ($question->quiz_id !== $quiz->id) {
            throw new NotFoundHttpException('This question does not belong to the quiz.');
        }

        $question->load('answers');
        $graded = ($this->gradeSingleAnswer)($question, $request->integer('answer_id'));

        $explanation = $question->explanation;
        $requestedLocale = $request->filled('language') ? $request->string('language')->toString() : null;
        if ($requestedLocale !== null && $requestedLocale !== 'en') {
            $translation = $question->translationFor($requestedLocale);
            if ($translation) {
                $explanation = $translation->fields['explanation'] ?? $explanation;
            }
        }

        return response()->json([
            'question_id' => $question->id,
            'selected_answer_id' => $graded['selected_answer_id'],
            'correct_answer_id' => $graded['correct_answer_id'],
            'is_correct' => $graded['is_correct'],
            'explanation' => $explanation,
            'answer_popularity' => ($this->computePopularity)($question),
        ]);
    }

    /**
     * AI tutor — hint or free-form question about a quiz question
     *
     * `mode=hint` nudges without revealing the answer; `mode=ask` answers the learner's `message`.
     * Same entitlement gate as attempts. Returns 503 when no LLM key is configured so the
     * feature degrades gracefully rather than 500-ing.
     */
    public function assist(QuizAssistRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        Gate::forUser($request->user('sanctum'))->authorize('attempt', $quiz);

        if ($question->quiz_id !== $quiz->id) {
            throw new NotFoundHttpException('This question does not belong to the quiz.');
        }

        $question->load('answers');

        try {
            $reply = ($this->generateAssist)(
                $question,
                $request->string('mode')->toString(),
                $request->input('message'),
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        return response()->json(['reply' => $reply]);
    }

    /**
     * Report a mistake in a question
     *
     * Lets a learner flag a typo/error in the question, image, hint, or a specific answer, with a
     * free-text comment and optional name/email. Same entitlement gate as attempts; the report is
     * attached to the signed-in user when there is one.
     */
    public function report(StoreQuizQuestionReportRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        Gate::forUser($request->user('sanctum'))->authorize('attempt', $quiz);

        if ($question->quiz_id !== $quiz->id) {
            throw new NotFoundHttpException('This question does not belong to the quiz.');
        }

        QuizQuestionReport::create([
            'quiz_question_id' => $question->id,
            'user_id' => $request->user('sanctum')?->id,
            'flagged' => $request->input('flagged'),
            'comment' => $request->string('comment')->toString(),
            'reporter_name' => $request->input('reporter_name'),
            'reporter_email' => $request->input('reporter_email'),
        ]);

        return response()->json(['message' => 'Thanks! Your report has been submitted.'], 201);
    }
}
