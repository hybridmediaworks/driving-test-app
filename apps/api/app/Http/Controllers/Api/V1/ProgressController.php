<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AttemptStatus;
use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    /** Questions a learner has to answer in a day for it to count towards their streak. */
    private const STREAK_DAILY_QUESTIONS = 15;

    /** How many days of streak history to return (the sidebar renders one dot per day). */
    private const STREAK_HISTORY_DAYS = 5;

    /**
     * My study progress for one state/vehicle/track (self-service)
     *
     * Requires authentication. Powers the state hub's progress sidebar. Everything here is derived
     * from quiz attempts the learner has actually recorded — there is no separate progress table to
     * drift out of sync, and nothing is estimated or modelled.
     *
     * `state` (code, e.g. `AL`), `vehicle_type` (name, e.g. `car`) and `test_track`
     * (`permit_test` / `driving_test`) scope the figures the same way `GET /quizzes` does. Omit
     * them for a global view.
     *
     * - `tests`: distinct quizzes completed at least once, over how many exist in that scope.
     * - `questions`: distinct questions answered at least once, over how many exist in that scope.
     *   Its percentage is the sidebar's headline progress bar.
     * - `streak`: consecutive days, ending today or yesterday, on which the learner answered at
     *   least `daily_target` questions. `days` is the most recent few days oldest-first so the
     *   client can render the weekday dots without doing its own date maths.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'state' => ['sometimes', 'string', 'max:10'],
            'vehicle_type' => ['sometimes', 'string', 'max:50'],
            'test_track' => ['sometimes', 'string', 'in:permit_test,driving_test'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $quizzes = $this->scopedQuizzes($request);
        $quizIds = $quizzes->pluck('id');

        $completedQuizIds = $user->quizAttempts()
            ->where('status', AttemptStatus::Completed)
            ->whereIn('quiz_id', $quizIds)
            ->distinct()
            ->pluck('quiz_id');

        return response()->json([
            'tests' => [
                'completed' => $completedQuizIds->count(),
                'total' => $quizIds->count(),
            ],
            'questions' => [
                'covered' => $this->questionsCovered($user, $quizIds),
                'total' => $this->questionsAvailable($quizIds),
                // Per-quiz breakdown, keyed by slug, for the sidebar's expandable checklist: a
                // group holding a single quiz (a marathon, the simulator) reports questions seen
                // rather than a tests-completed count. Only quizzes actually started appear.
                'by_quiz' => $this->questionsCoveredByQuiz($user, $quizIds),
            ],
            'streak' => $this->streak($user),
        ]);
    }

    /**
     * Set my exam date (self-service)
     *
     * Requires authentication. `exam_date` is a `Y-m-d` date, or null to clear it. Accepts past
     * dates — a learner who has already sat the exam may still be studying for a retake, and this
     * is a personal planning note, not a booking.
     */
    public function updateExamDate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'exam_date' => ['present', 'nullable', 'date'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->exam_date = $data['exam_date'];
        $user->save();

        return response()->json(['exam_date' => $user->exam_date?->toDateString()]);
    }

    /**
     * The quizzes that count towards this scope — the same active/published set `GET /quizzes`
     * lists, so the denominators here match what the learner can actually see and take.
     *
     * @return \Illuminate\Support\Collection<int, Quiz>
     */
    private function scopedQuizzes(Request $request)
    {
        return Quiz::query()
            ->where('is_active', true)
            ->when($request->filled('state'), fn (Builder $q) => $q->whereHas(
                'state',
                fn (Builder $s) => $s->where('code', $request->string('state')->toString())
            ))
            ->when($request->filled('vehicle_type'), fn (Builder $q) => $q->whereHas(
                'vehicleType',
                fn (Builder $v) => $v->where('name', $request->string('vehicle_type')->toString())
            ))
            ->when($request->filled('test_track'), fn (Builder $q) => $q->where(
                'test_track',
                $request->string('test_track')->toString()
            ))
            ->get(['id']);
    }

    /**
     * Distinct questions this learner has answered at least once within the scoped quizzes.
     * Counted from the answers themselves rather than from attempt totals, so re-taking the same
     * test doesn't inflate coverage, and an abandoned attempt still counts the questions it did
     * reach.
     *
     * @param  \Illuminate\Support\Collection<int, int>  $quizIds
     */
    private function questionsCovered(User $user, $quizIds): int
    {
        if ($quizIds->isEmpty()) {
            return 0;
        }

        return DB::table('quiz_attempt_answers')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_answers.quiz_attempt_id')
            ->where('quiz_attempts.user_id', $user->id)
            ->whereIn('quiz_attempts.quiz_id', $quizIds)
            ->distinct()
            ->count('quiz_attempt_answers.quiz_question_id');
    }

    /**
     * Distinct questions answered per quiz, keyed by quiz slug. Same counting rule as
     * `questionsCovered`, just not collapsed across quizzes.
     *
     * @param  \Illuminate\Support\Collection<int, int>  $quizIds
     * @return array<string, int>
     */
    private function questionsCoveredByQuiz(User $user, $quizIds): array
    {
        if ($quizIds->isEmpty()) {
            return [];
        }

        return DB::table('quiz_attempt_answers')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_answers.quiz_attempt_id')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
            ->where('quiz_attempts.user_id', $user->id)
            ->whereIn('quiz_attempts.quiz_id', $quizIds)
            ->groupBy('quizzes.slug')
            ->selectRaw('quizzes.slug as slug, COUNT(DISTINCT quiz_attempt_answers.quiz_question_id) as covered')
            ->pluck('covered', 'slug')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    /**
     * How many questions exist across the scoped quizzes. `quiz_questions.quiz_id` is a direct
     * foreign key — a question belongs to exactly one quiz, and a marathon carries its own rows
     * rather than referencing the tests it spans — so this is a plain count, not a distinct one.
     *
     * @param  \Illuminate\Support\Collection<int, int>  $quizIds
     */
    private function questionsAvailable($quizIds): int
    {
        if ($quizIds->isEmpty()) {
            return 0;
        }

        return DB::table('quiz_questions')
            ->whereIn('quiz_id', $quizIds)
            ->count();
    }

    /**
     * Consecutive days ending today (or yesterday — a streak isn't broken until the day is over)
     * on which the learner answered at least the daily target. Deliberately NOT scoped to one
     * state/vehicle: the streak is about showing up to study at all, and splitting it per state
     * would let the same day's work count several times over.
     *
     * @return array<string, mixed>
     */
    private function streak(User $user): array
    {
        $today = Carbon::today();

        $perDay = DB::table('quiz_attempt_answers')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_answers.quiz_attempt_id')
            ->where('quiz_attempts.user_id', $user->id)
            ->whereNotNull('quiz_attempt_answers.answered_at')
            ->where('quiz_attempt_answers.answered_at', '>=', $today->copy()->subYear())
            ->selectRaw('DATE(quiz_attempt_answers.answered_at) as day, COUNT(*) as answered')
            ->groupBy('day')
            ->pluck('answered', 'day');

        $met = fn (Carbon $day): bool => (int) ($perDay[$day->toDateString()] ?? 0) >= self::STREAK_DAILY_QUESTIONS;

        // Today not being done yet shouldn't read as a broken streak, so start counting from
        // yesterday when today's target hasn't been hit.
        $cursor = $met($today) ? $today->copy() : $today->copy()->subDay();
        $current = 0;
        while ($met($cursor)) {
            $current++;
            $cursor->subDay();
        }

        $days = [];
        for ($i = self::STREAK_HISTORY_DAYS - 1; $i >= 0; $i--) {
            $day = $today->copy()->subDays($i);
            $days[] = [
                'date' => $day->toDateString(),
                'answered' => (int) ($perDay[$day->toDateString()] ?? 0),
                'met' => $met($day),
            ];
        }

        return [
            'current' => $current,
            'daily_target' => self::STREAK_DAILY_QUESTIONS,
            'answered_today' => (int) ($perDay[$today->toDateString()] ?? 0),
            'days' => $days,
        ];
    }
}
