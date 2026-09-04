<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\Quiz\ComputeAnswerPopularity;
use App\Actions\Quiz\GenerateQuestionAssist;
use App\Actions\Quiz\GenerateResultsInsight;
use App\Actions\Quiz\GradeQuizAttempt;
use App\Actions\Quiz\GradeSingleAnswer;
use App\Actions\Quiz\ResolveQuizProgression;
use App\Actions\Quiz\StartOrResumeQuizAttempt;
use App\Actions\Quiz\TranslateQuizContent;
use App\Enums\AttemptStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Public\CheckQuizAnswerRequest;
use App\Http\Requests\Api\V1\Public\QuizAssistRequest;
use App\Http\Requests\Api\V1\Public\QuizResultsInsightRequest;
use App\Http\Requests\Api\V1\Public\StartQuizAttemptRequest;
use App\Http\Requests\Api\V1\Public\StoreQuizAttemptRequest;
use App\Http\Requests\Api\V1\Public\StoreQuizQuestionReportRequest;
use App\Http\Resources\Api\V1\Public\QuizQuestionResource;
use App\Http\Resources\Api\V1\Public\QuizResource;
use App\Http\Resources\Api\V1\QuizAttemptResource;
use App\Models\ChallengeBankItem;
use App\Models\Quiz;
use App\Models\QuizAttempt;
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
        private readonly GenerateResultsInsight $generateResultsInsight,
        private readonly ResolveQuizProgression $resolveProgression,
        private readonly StartOrResumeQuizAttempt $startOrResumeAttempt,
    ) {}

    /**
     * A caller's guest identity, read from the `X-Guest-Token` header the web client attaches to
     * every request once it has generated one (persisted client-side in localStorage), falling
     * back to the `guest_token` body field some endpoints have historically accepted. Null means
     * "no guest identity available" — never generates one; callers that need a guaranteed value
     * for a brand-new guest attempt generate their own fallback at the point of use.
     */
    private function resolveGuestToken(Request $request): ?string
    {
        $token = $request->header('X-Guest-Token') ?: $request->input('guest_token');

        return is_string($token) && $token !== '' ? $token : null;
    }

    /**
     * Sets `in_progress_answered` on each quiz that has a resumable in-progress attempt for this
     * caller (`user_id` match, or guest-token match when there's no user) — QuizResource reads it
     * to expose the `in_progress` field that drives the "Continue" CTA. No-op for a caller with no
     * identity at all (no user, no guest token) and for an empty quiz list.
     *
     * @param  iterable<Quiz>  $quizzes
     */
    private function attachInProgressSummaries(iterable $quizzes, ?int $userId, Request $request): void
    {
        $guestToken = $userId === null ? $this->resolveGuestToken($request) : null;
        if ($userId === null && $guestToken === null) {
            return;
        }

        $quizIds = [];
        foreach ($quizzes as $quiz) {
            $quizIds[] = $quiz->id;
        }

        if ($quizIds === []) {
            return;
        }

        $inProgress = QuizAttempt::query()
            ->where('status', AttemptStatus::InProgress)
            ->where('updated_at', '>=', now()->subDays(StartOrResumeQuizAttempt::RESUMABLE_WITHIN_DAYS))
            ->whereIn('quiz_id', $quizIds)
            ->when(
                $userId !== null,
                fn ($q) => $q->where('user_id', $userId),
                fn ($q) => $q->where('guest_token', $guestToken),
            )
            ->withCount('answers')
            ->get()
            ->keyBy('quiz_id');

        if ($inProgress->isEmpty()) {
            return;
        }

        foreach ($quizzes as $quiz) {
            $attempt = $inProgress->get($quiz->id);
            if ($attempt !== null) {
                $quiz->setAttribute('in_progress_answered', $attempt->answers_count);
                // From the attempt itself (captured once at start time), not the quiz's own,
                // separately-maintained `total_questions` — the two can disagree (e.g. content
                // edited after the attempt started), and the attempt's own count is what the
                // "x/y" progress label should actually reflect.
                $quiz->setAttribute('in_progress_total', $attempt->total_questions);
            }
        }
    }

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
        // No auth:sanctum middleware on this route, so resolve the token holder explicitly (same as
        // the resource/policy) to surface this caller's best score per quiz — the frontend uses it
        // to drive its progressive "finish one to unlock the next" ladder and the pass/fail badges.
        // A guest (no user) is identified the same way attempt resume already works — by whatever
        // X-Guest-Token this browser has been sending since it first started a quiz — so completing
        // a test as a guest advances the ladder for them too, not just for logged-in users.
        $userId = $request->user('sanctum')?->id;
        $guestToken = $userId === null ? $this->resolveGuestToken($request) : null;

        $query = Quiz::query()
            ->where('is_active', true)
            ->with(['category', 'quizType', 'state', 'vehicleType', 'previewImageQuestion.media'])
            ->when($userId !== null || $guestToken !== null, fn ($q) => $q->withMax([
                'attempts as best_score' => fn ($a) => $a
                    ->where('status', AttemptStatus::Completed)
                    ->when(
                        $userId !== null,
                        fn ($aq) => $aq->where('user_id', $userId),
                        fn ($aq) => $aq->where('guest_token', $guestToken),
                    ),
            ], 'score'))
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
        $quizzes = $query->paginate($perPage)->withQueryString();

        $this->attachInProgressSummaries($quizzes, $userId, $request);

        // A full ladder request (state + vehicle_type + test_track) gets its progressive lock state
        // resolved server-side so web and mobile render the same "finish one to unlock the next"
        // chain. Other requests (e.g. a `slug` lookup, or a category-only browse) fall back to the
        // payment-only lock_reason the resource computes on its own.
        if ($request->filled('state') && $request->filled('vehicle_type') && $request->filled('test_track')) {
            $progression = ($this->resolveProgression)(
                $request->string('state')->toString(),
                $request->string('vehicle_type')->toString(),
                $request->string('test_track')->toString(),
                $userId !== null ? $request->user('sanctum') : null,
                $guestToken,
            );

            foreach ($quizzes as $quiz) {
                if (isset($progression[$quiz->id])) {
                    $quiz->setAttribute('lock_reason', $progression[$quiz->id]['lock_reason']);
                    $quiz->setAttribute('is_next', $progression[$quiz->id]['is_next']);
                }
            }
        }

        return QuizResource::collection($quizzes);
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
        $this->attachInProgressSummaries([$quiz], $request->user('sanctum')?->id, $request);

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
     * Start or resume a quiz attempt
     *
     * Works for both guests and logged-in users, same identity rules as `storeAttempt` below. If
     * the caller already has an in-progress attempt on this quiz from within the last 7 days, that
     * same attempt (and its `question_order` and already-graded `answers`) is returned instead of
     * a new one being created — this is what makes leaving mid-quiz and coming back resumable.
     * Pass `force_new: true` (used by Restart) to always start a brand-new attempt regardless of
     * any existing in-progress one.
     *
     * `answers` in the response is keyed by question id and shaped exactly like `checkAnswer`'s
     * response below, one entry per question already answered in this attempt — the client can
     * rehydrate its practice-mode state from it directly.
     */
    public function startAttempt(StartQuizAttemptRequest $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user('sanctum');
        Gate::forUser($user)->authorize('attempt', $quiz);
        $guestToken = $user === null
            ? ($this->resolveGuestToken($request) ?? (string) Str::uuid())
            : null;

        $attempt = ($this->startOrResumeAttempt)($quiz, $user?->id, $guestToken, $request->boolean('force_new'));

        $answers = [];
        foreach ($attempt->answers as $answer) {
            $answers[$answer->quiz_question_id] = [
                'question_id' => $answer->quiz_question_id,
                'selected_answer_id' => $answer->quiz_answer_id,
                'correct_answer_id' => $answer->question?->answers->firstWhere('is_correct', true)?->id,
                'is_correct' => $answer->is_correct,
                'explanation' => $answer->question?->explanation,
                'answer_popularity' => null,
            ];
        }

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'question_order' => $attempt->question_order,
                'started_at' => $attempt->started_at,
                'total_questions' => $attempt->total_questions,
            ],
            // Cast to object so an empty attempt serializes as `{}`, not `[]` — PHP's json_encode
            // can't tell an empty map from an empty list on its own, and the client always expects
            // an object here regardless of how many questions have been answered so far.
            'answers' => (object) $answers,
            'guest_token' => $guestToken,
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
     * Pass the `attempt_id` from `startAttempt` above to close out that same attempt (merging in
     * any answers already persisted from `checkAnswer` calls) rather than creating a new one.
     *
     * Guests: identified via the `X-Guest-Token` header (or the `guest_token` field, kept for
     * back-compat) — one is generated server-side if neither is sent.
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
            ? ($this->resolveGuestToken($request) ?? (string) Str::uuid())
            : null;

        $attempt = ($this->gradeAttempt)(
            $quiz,
            $request->validated('answers'),
            $user?->id,
            $guestToken,
            $request->integer('duration_seconds') ?: null,
            $request->integer('attempt_id') ?: null,
        );

        return response()->json(['attempt' => new QuizAttemptResource($attempt)], 201);
    }

    /**
     * My latest completed attempt for this quiz ("View results")
     *
     * Works for both guests and logged-in users, same identity rules as `storeAttempt` above —
     * this is deliberately a public endpoint rather than the account-only `GET /attempts`, because
     * that one can't be reached without a Bearer token and so can never resolve a guest's own
     * results (it has no guest_token to key off). Returns `{"attempt": null}` (not a 404) when
     * this caller has no completed attempt on this quiz yet.
     */
    public function latestAttempt(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user('sanctum');
        Gate::forUser($user)->authorize('attempt', $quiz);
        $guestToken = $user === null ? $this->resolveGuestToken($request) : null;

        $attempt = $guestToken === null && $user === null
            ? null
            : QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('status', AttemptStatus::Completed)
                ->when(
                    $user !== null,
                    fn ($q) => $q->where('user_id', $user->id),
                    fn ($q) => $q->where('guest_token', $guestToken),
                )
                ->with('answers.question.answers')
                ->latest('completed_at')
                ->first();

        return response()->json(['attempt' => $attempt ? new QuizAttemptResource($attempt) : null]);
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
     *
     * Optional `attempt_id` (from `startAttempt` above) persists this answer against that attempt,
     * so it's still there if the learner reloads or comes back later — silently ignored if it
     * doesn't resolve to the caller's own in-progress attempt on this quiz (e.g. it was already
     * submitted, or belongs to someone else), so grading/feedback still works either way.
     */
    public function checkAnswer(CheckQuizAnswerRequest $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $user = $request->user('sanctum');
        Gate::forUser($user)->authorize('attempt', $quiz);

        if ($question->quiz_id !== $quiz->id) {
            throw new NotFoundHttpException('This question does not belong to the quiz.');
        }

        $question->load('answers');
        $graded = ($this->gradeSingleAnswer)($question, $request->integer('answer_id'));

        $user = $request->user('sanctum');

        // Keep the Challenge Bank live as the learner answers — for signed-in users (by user_id) and
        // signed-out guests alike (by guest_token): a wrong pick files the question for re-practice
        // immediately — no need to finish the whole test — and a correct one clears it.
        $bankOwner = $user !== null
            ? ['user_id' => $user->id]
            : (($guestToken = $this->resolveGuestToken($request)) !== null ? ['guest_token' => $guestToken] : null);

        if ($bankOwner !== null) {
            if ($graded['is_correct']) {
                ChallengeBankItem::query()
                    ->where($bankOwner)
                    ->where('quiz_question_id', $question->id)
                    ->delete();
            } else {
                ChallengeBankItem::query()->insertOrIgnore([
                    ...$bankOwner,
                    'quiz_question_id' => $question->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Persist the answer against the in-progress attempt so the player can resume ("Continue").
        $attemptId = $request->integer('attempt_id') ?: null;
        if ($attemptId !== null) {
            $attempt = $this->startOrResumeAttempt->findOwned(
                $attemptId,
                $quiz,
                $user?->id,
                $user === null ? $this->resolveGuestToken($request) : null,
            );

            $attempt?->answers()->updateOrCreate(
                ['quiz_question_id' => $question->id],
                [
                    'quiz_answer_id' => $graded['selected_answer_id'],
                    'is_correct' => $graded['is_correct'],
                    'answered_at' => now(),
                ],
            );
            $attempt?->touch();
        }

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
     * The full explanation is only unlocked once `answered=true` — before the learner has answered,
     * both modes stay non-revealing so the tutor can't be used to skip straight to the answer.
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
                $request->boolean('answered'),
                $request->filled('selected_answer_id') ? (int) $request->input('selected_answer_id') : null,
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

    /**
     * Results-screen insight
     *
     * Given the score and which questions were missed, returns the learner's "weak areas" (grounded
     * on the topics of the missed questions) plus a short, dynamic coach message. Same entitlement
     * gate as attempts; degrades to topic-based weak areas + a template message when the LLM is
     * unavailable.
     */
    public function resultsInsight(QuizResultsInsightRequest $request, Quiz $quiz): JsonResponse
    {
        Gate::forUser($request->user('sanctum'))->authorize('attempt', $quiz);

        $insight = ($this->generateResultsInsight)(
            $quiz,
            $request->integer('correct'),
            $request->integer('total'),
            array_map('intval', $request->input('wrong_question_ids', [])),
        );

        return response()->json($insight);
    }
}
