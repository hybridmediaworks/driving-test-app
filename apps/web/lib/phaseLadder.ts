import type { Quiz, QuizCategory, PaginatedResponse } from "@driving-test-app/shared";
import { api } from "./api";

export type PhaseLadderStep = {
  step: number;
  title?: string;
  slug?: string;
  totalQuestions?: string;
  totalTime?: string;
  type?: "free" | "premium";
  /** Whether THIS viewer is actually locked out — distinct from `type`, which only describes
   * the content's own pricing. An entitled subscriber sees `type: "premium"` but `locked: false`. */
  locked?: boolean;
  /** Why a locked step is locked, so the card knows what a click should do:
   *  - "premium": the viewer isn't entitled (hasn't paid) — the whole card sends them to /pricing.
   *  - "progress": the viewer IS entitled but hasn't finished the previous step yet — silent, no nav.
   *  Undefined when the step is unlocked. Mirrors the API's `lock_reason` (see ResolveQuizProgression). */
  lockMode?: "premium" | "progress";
  /** Whether the current user has already completed this quiz (from the API's `attempted`). */
  attempted?: boolean;
  /** The current user's result on a completed quiz — "passed" shows a green tick, "failed" a red
   *  mark. Undefined when the quiz hasn't been completed yet. */
  outcome?: "passed" | "failed";
  /** Present when the current user has a resumable in-progress attempt on this quiz (from the
   *  API's `in_progress`) — lets the step card offer "Continue" instead of "Start". */
  inProgress?: { answered: number; total: number };
  image?: string;
  status?: "next";
  style?: "large";
  completed?: boolean;
  justCompleted?: boolean;
  /** A non-quiz placeholder rung (e.g. "extra support" for states with no quiz there yet) — renders
   * a "coming soon" card in the step grid so it flows through the same ladder connectors as a real step. */
  placeholder?: boolean;
};

export type PhaseLadderPhase = {
  phase: number;
  phaseStatus: string;
  header: {
    headerTitle: string;
    headerDesc: string;
    totalQuestions: string;
    totalTime: string;
  };
  steps: PhaseLadderStep[];
};

const CATEGORIES_CACHE_MS = 5 * 60 * 1000;
let categoriesCache: { at: number; data: QuizCategory[] } | null = null;

async function fetchOrderedCategories(): Promise<QuizCategory[]> {
  if (categoriesCache && Date.now() - categoriesCache.at < CATEGORIES_CACHE_MS) {
    return categoriesCache.data;
  }

  const data = await api.get<{ data: QuizCategory[] }>("/quiz-categories").then((res) => res.data);
  categoriesCache = { at: Date.now(), data };
  return data;
}

function formatMinutes(durationSeconds: number | null): string | undefined {
  if (!durationSeconds) return undefined;
  const minutes = Math.round(durationSeconds / 60);
  return minutes > 0 ? String(minutes) : undefined;
}

/** Maps the API's tri-state `user_passed` (true/false/null) to a completed-quiz badge outcome. */
function outcomeOf(quiz: Quiz): "passed" | "failed" | undefined {
  if (quiz.user_passed == null) return undefined;
  return quiz.user_passed ? "passed" : "failed";
}

/** In-flight/resolved request cache, keyed by state+vehicle+track — StatePhase/PremiumCTA each
 * call usePhaseCompletion independently (once per phase they render), so without this a single
 * page render would fire one real network request per phase instead of sharing one. */
const ladderCache = new Map<string, Promise<PhaseLadderPhase[]>>();

/**
 * Drops the cached ladders so the next fetch reflects fresh completion state. Called right after a
 * quiz attempt is submitted — otherwise the module-level cache would keep serving the pre-attempt
 * ladder (with the just-finished quiz still marked not-completed) for the rest of the session, so a
 * newly unlocked step wouldn't appear until a hard reload.
 */
export function invalidatePhaseLadder(): void {
  ladderCache.clear();
}

/**
 * Maps a quiz's server-resolved `lock_reason` (see the API's ResolveQuizProgression) to the step's
 * lock state. The progressive "finish one to unlock the next" chain is computed server-side now, so
 * both web and mobile render the same result — the frontend just reflects it.
 */
function lockFromQuiz(quiz: Quiz): { locked: boolean; lockMode: PhaseLadderStep["lockMode"] } {
  const reason = quiz.lock_reason ?? null;
  return { locked: reason !== null, lockMode: reason ?? undefined };
}

/**
 * Real replacement for the old stepsmockdata.json — builds the phase ladder from actual quizzes,
 * grouped by their real quiz_category, in the backend's own category order. A category with zero
 * quizzes for this state/vehicle/track combination simply doesn't produce a phase — the ladder
 * length is genuinely variable per combination now, not fixed at 7.
 *
 * Each quiz's progressive lock state (`lock_reason`, `is_next`) and completion (`attempted`,
 * `user_passed`) are resolved server-side (see the API's ResolveQuizProgression), so this just
 * reflects them. The result is cached per state/vehicle/track for the session;
 * invalidatePhaseLadder() clears it after an attempt so a newly unlocked step shows up without a
 * hard reload.
 */
export function fetchPhaseLadder(stateCode: string, vehicleType: string, testTrack: string): Promise<PhaseLadderPhase[]> {
  const key = `${stateCode}|${vehicleType}|${testTrack}`;
  const cached = ladderCache.get(key);
  if (cached) return cached;

  const promise = loadPhaseLadder(stateCode, vehicleType, testTrack).catch((err) => {
    ladderCache.delete(key);
    throw err;
  });
  ladderCache.set(key, promise);
  return promise;
}

/**
 * The slug of the single quiz a learner should start/continue with for this state/vehicle/track —
 * the server-resolved "next" step (see ResolveQuizProgression) if one exists, otherwise the very
 * first real step (e.g. everything in this ladder is already completed — start over rather than
 * link nowhere). Null only when the ladder has no real steps at all for this combination.
 *
 * Shares fetchPhaseLadder's cache, so calling this alongside usePhaseCompletion/usePhaseNumbers on
 * the same page (see usePhaseCompletion.ts) costs no extra request.
 */
export async function resolveNextQuizSlug(
  stateCode: string,
  vehicleType: string,
  testTrack: string,
): Promise<string | null> {
  const phases = await fetchPhaseLadder(stateCode, vehicleType, testTrack);
  const steps = phases.flatMap((p) => p.steps).filter((s) => !s.placeholder && s.slug);
  return steps.find((s) => s.status === "next")?.slug ?? steps[0]?.slug ?? null;
}

async function loadPhaseLadder(stateCode: string, vehicleType: string, testTrack: string): Promise<PhaseLadderPhase[]> {
  const [categories, quizzesResponse] = await Promise.all([
    fetchOrderedCategories(),
    api.get<PaginatedResponse<Quiz>>(
      `/quizzes?state=${stateCode}&vehicle_type=${vehicleType}&test_track=${testTrack}&per_page=100`,
    ),
  ]);

  const quizzesByCategory = new Map<number, Quiz[]>();
  for (const quiz of quizzesResponse.data) {
    const categoryId = quiz.category?.id ?? quiz.quiz_category_id;
    const bucket = quizzesByCategory.get(categoryId);
    if (bucket) bucket.push(quiz);
    else quizzesByCategory.set(categoryId, [quiz]);
  }

  const EXTRA_SUPPORT_TITLE = "The extra support";
  const phases: PhaseLadderPhase[] = [];
  let phaseNumber = 0;

  for (const category of categories) {
    // "The extra support" is always rendered last (just above the handbook), so skip it here and
    // append it after the loop — otherwise its category order could drop it mid-ladder for states
    // that have quizzes in categories ordered after it.
    if (category.title === EXTRA_SUPPORT_TITLE) continue;

    const quizzes = quizzesByCategory.get(category.id);
    if (!quizzes || quizzes.length === 0) continue;

    phaseNumber++;
    const totalQuestions = quizzes.reduce((sum, q) => sum + q.total_questions, 0);

    phases.push({
      phase: phaseNumber,
      phaseStatus: phaseNumber === 1 ? "active" : "",
      header: {
        headerTitle: category.title,
        headerDesc: category.description ?? "",
        totalQuestions: String(totalQuestions),
        totalTime: "",
      },
      steps: quizzes.map((quiz, index) => ({
        step: index + 1,
        title: quiz.title,
        slug: quiz.slug,
        totalQuestions: String(quiz.total_questions),
        totalTime: formatMinutes(quiz.duration_seconds),
        type: quiz.is_premium ? "premium" : "free",
        ...lockFromQuiz(quiz),
        attempted: quiz.attempted ?? false,
        // Drive the connector pipeline: a completed step's connectors render blue, so the line is
        // blue up to the next (first not-yet-completed) task. justCompleted stays false — this is the
        // static progress on load, not a live just-finished animation.
        completed: quiz.attempted ?? false,
        outcome: outcomeOf(quiz),
        inProgress: quiz.in_progress ?? undefined,
        status: quiz.is_next ? "next" : undefined,
        image: quiz.preview_image_url ?? quiz.cover_image_url ?? "/driving-tests.jpg",
      })),
    });
  }

  // "The extra support" is always the final rung, directly above the handbook — regardless of how
  // many other categories this state/vehicle/track happens to have quizzes in. States that have the
  // quiz render its real steps; the two that don't yet (AL/AK) get a "coming soon" placeholder so
  // the ladder still matches the reference instead of ending abruptly at the exam simulator.
  const extraCategory = categories.find((c) => c.title === EXTRA_SUPPORT_TITLE);
  if (extraCategory) {
    const extraQuizzes = quizzesByCategory.get(extraCategory.id) ?? [];
    phaseNumber++;
    phases.push({
      phase: phaseNumber,
      phaseStatus: "",
      header: {
        headerTitle: extraCategory.title,
        headerDesc: extraCategory.description ?? "",
        totalQuestions: String(extraQuizzes.reduce((sum, q) => sum + q.total_questions, 0)),
        totalTime: "",
      },
      steps:
        extraQuizzes.length > 0
          ? extraQuizzes.map((quiz, index) => ({
              step: index + 1,
              title: quiz.title,
              slug: quiz.slug,
              totalQuestions: String(quiz.total_questions),
              totalTime: formatMinutes(quiz.duration_seconds),
              type: quiz.is_premium ? ("premium" as const) : ("free" as const),
              ...lockFromQuiz(quiz),
              attempted: quiz.attempted ?? false,
              completed: quiz.attempted ?? false,
              outcome: outcomeOf(quiz),
              inProgress: quiz.in_progress ?? undefined,
              status: quiz.is_next ? ("next" as const) : undefined,
              image: quiz.preview_image_url ?? quiz.cover_image_url ?? "/driving-tests.jpg",
            }))
          : [{ step: 1, placeholder: true, style: "large" as const }],
    });
  }

  return phases;
}
