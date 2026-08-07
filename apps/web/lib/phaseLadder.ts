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
  image?: string;
  status?: "next";
  style?: "large";
  completed?: boolean;
  justCompleted?: boolean;
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

/** In-flight/resolved request cache, keyed by state+vehicle+track — StatePhase/PremiumCTA each
 * call usePhaseCompletion independently (once per phase they render), so without this a single
 * page render would fire one real network request per phase instead of sharing one. */
const ladderCache = new Map<string, Promise<PhaseLadderPhase[]>>();

/**
 * Real replacement for the old stepsmockdata.json — builds the phase ladder from actual quizzes,
 * grouped by their real quiz_category, in the backend's own category order. A category with zero
 * quizzes for this state/vehicle/track combination simply doesn't produce a phase — the ladder
 * length is genuinely variable per combination now, not fixed at 7.
 *
 * Completion tracking isn't wired yet (see lib/usePhaseCompletion.ts) — every step currently
 * renders as not-completed, matching the documented "fresh user" baseline, until the quiz player
 * is wired to real attempts.
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

  const phases: PhaseLadderPhase[] = [];
  let phaseNumber = 0;

  for (const category of categories) {
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
        locked: quiz.locked ?? quiz.is_premium,
        image: quiz.cover_image_url ?? "/driving-tests.jpg",
        status: phaseNumber === 1 && index === 0 ? "next" : undefined,
      })),
    });
  }

  return phases;
}
