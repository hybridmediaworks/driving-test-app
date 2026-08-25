import { type VehicleType } from "@/store/userStore";
import type { PublicCheatSheet, PublicQuiz, QuizCategory } from "@driving-test-app/shared";
import { ImageSourcePropType } from "react-native";
import { fetchCheatSheets, fetchQuiz, fetchQuizCategories, fetchQuizzes } from "./quizApi";

export interface TodayTestCard {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  locked?: boolean;
  passingScore: number;
}

export interface TodayTestRow {
  /** The category's `name` slug — pass-through so "See all" can filter by it later. */
  category: string;
  title: string;
  badge: string;
  tests: TodayTestCard[];
}

export interface TodayTheoryItem {
  id: string;
  title: string;
  icon: "cloud-download" | "lock";
  action: "get" | "unlock";
}

export interface TodayHeroTest {
  title: string;
  description: string;
  image: ImageSourcePropType;
  testId: string;
}

export interface TodayExamCard {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  totalQuestions: number;
  locked: boolean;
}

export interface TodayData {
  testRows: TodayTestRow[];
  theoryItems: TodayTheoryItem[];
  examCard: TodayExamCard | null;
}

// Pexels stock photos, same source used by the previous mock data — used only when a quiz has
// no cover_image_url so cards never render blank.
function fallbackImage(vehicle: VehicleType): ImageSourcePropType {
  const photoId: Record<VehicleType, number> = {
    car: 1545743,
    motorcycle: 2611684,
    cdl: 1095814,
  };
  return {
    uri: `https://images.pexels.com/photos/${photoId[vehicle]}/pexels-photo-${photoId[vehicle]}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`,
  };
}

function toCard(quiz: PublicQuiz, vehicle: VehicleType): TodayTestCard {
  return {
    id: String(quiz.id),
    title: quiz.title,
    subtitle: `${quiz.total_questions} Questions`,
    image: quiz.cover_image_url ? { uri: quiz.cover_image_url } : fallbackImage(vehicle),
    locked: quiz.locked,
    passingScore: quiz.passing_score_percent ?? 80,
  };
}

function toTheoryItem(sheet: PublicCheatSheet): TodayTheoryItem {
  return {
    id: String(sheet.id),
    title: sheet.title,
    icon: sheet.locked ? "lock" : "cloud-download",
    action: sheet.locked ? "unlock" : "get",
  };
}

// "The extra support" is always rendered last, matching the web app's real (dynamic) state-page
// ladder (apps/web/lib/phaseLadder.ts) — otherwise its position in the backend's admin-defined
// category order could drop it mid-list.
const EXTRA_SUPPORT_TITLE = "The extra support";

/**
 * Fetches everything the Today (home) tab needs in one go. Any individual request that fails
 * (network hiccup, or a vehicle/state combo with no seeded data yet) resolves to an empty list
 * rather than rejecting, so one bad section never blanks out the whole page.
 *
 * The "Tests" rows mirror the web app's actual (live) state-page ladder logic in
 * apps/web/lib/phaseLadder.ts: walk every category from GET /quiz-categories in the backend's own
 * order, restricted to `test_track: permit_test`, and emit a row for any category that has at
 * least one quiz — no name whitelist, so a brand-new category shows up with zero app changes.
 * "The extra support" is special-cased to always sort last, same as web.
 *
 * The one deliberate difference from web: mobile keeps the exam simulator as its own dedicated
 * Exam card (below) rather than folding it into these rows, so `quiz_type: "final"` quizzes are
 * filtered out of the category grouping entirely.
 */
export async function fetchTodayData(vehicle: VehicleType, state: string): Promise<TodayData> {
  const [allQuizzes, categories, cheatSheetsRaw] = await Promise.all([
    fetchQuizzes({ vehicleType: vehicle, state, testTrack: "permit_test", perPage: 100 }).catch(() => []),
    fetchQuizCategories().catch(() => []),
    fetchCheatSheets({ vehicleType: vehicle, state }).catch(() => []),
  ]);

  // "final" quiz_type is the one stable, non-arbitrary signal for "this is the exam simulator"
  // — it's surfaced in its own Exam card below, not as one of the category rows.
  const practiceQuizzes = allQuizzes.filter((q) => q.quiz_type?.name !== "final");
  const examQuizzes = allQuizzes.filter((q) => q.quiz_type?.name === "final");

  const byCategoryId = new Map<number, PublicQuiz[]>();
  for (const quiz of practiceQuizzes) {
    const categoryId = quiz.category?.id;
    if (categoryId === undefined) continue;
    if (!byCategoryId.has(categoryId)) byCategoryId.set(categoryId, []);
    byCategoryId.get(categoryId)!.push(quiz);
  }

  const orderedRows: Omit<TodayTestRow, "badge">[] = [];
  for (const category of categories) {
    if (category.title === EXTRA_SUPPORT_TITLE) continue; // appended after the loop, always last
    const quizzes = byCategoryId.get(category.id);
    if (!quizzes || quizzes.length === 0) continue;
    orderedRows.push({
      category: category.name,
      title: category.title,
      tests: quizzes.map((q) => toCard(q, vehicle)),
    });
  }
  const extraSupport = categories.find((c) => c.title === EXTRA_SUPPORT_TITLE);
  const extraSupportQuizzes = extraSupport ? byCategoryId.get(extraSupport.id) : undefined;
  if (extraSupport && extraSupportQuizzes && extraSupportQuizzes.length > 0) {
    orderedRows.push({
      category: extraSupport.name,
      title: extraSupport.title,
      tests: extraSupportQuizzes.map((q) => toCard(q, vehicle)),
    });
  }

  const testRows: TodayTestRow[] = orderedRows.map((row, index) => ({
    ...row,
    badge: `Step ${index + 1}`,
  }));

  const examQuiz = examQuizzes[0] ?? null;
  const examCard: TodayExamCard | null = examQuiz
    ? {
        id: String(examQuiz.id),
        title: examQuiz.title,
        subtitle: `${examQuiz.total_questions} Questions`,
        image: examQuiz.cover_image_url
          ? { uri: examQuiz.cover_image_url }
          : fallbackImage(vehicle),
        totalQuestions: examQuiz.total_questions,
        locked: examQuiz.locked,
      }
    : null;

  return {
    testRows,
    examCard,
    theoryItems: cheatSheetsRaw.map(toTheoryItem),
  };
}

/**
 * Picks the hero ("Take Me Next") card from the Tests rows — the first quiz, in row/ladder
 * order, that's both unlocked and not yet attempted. `completedIds` is the caller's local
 * progress store (real attempt tracking isn't wired to the API yet), so this has to run
 * client-side rather than inside fetchTodayData above. Falls back to the first unlocked quiz
 * (even if already completed), then to the very first quiz overall, so the hero card never goes
 * empty just because everything visible happens to be finished or locked.
 */
export function pickHeroTest(testRows: TodayTestRow[], completedIds: Set<string>): TodayHeroTest | null {
  const ladderQuizzes = testRows.flatMap((row) => row.tests);
  const heroQuiz =
    ladderQuizzes.find((q) => !q.locked && !completedIds.has(q.id)) ??
    ladderQuizzes.find((q) => !q.locked) ??
    ladderQuizzes[0] ??
    null;

  return heroQuiz
    ? {
        title: heroQuiz.title,
        description:
          "Use this card to proceed. It'll always point to the next test you need to take.",
        image: heroQuiz.image,
        testId: heroQuiz.id,
      }
    : null;
}

export interface TodayTestDetail {
  id: string;
  title: string;
  image: ImageSourcePropType;
  description: string;
  questionsCount: number;
  passingScore: number;
}

// Category descriptions rarely change mid-session — fetched once and reused across every
// quiz-detail screen visit instead of re-requesting on every navigation.
let categoryCache: QuizCategory[] | null = null;
async function getCategoriesCached(): Promise<QuizCategory[]> {
  if (!categoryCache) {
    categoryCache = await fetchQuizCategories().catch(() => []);
  }
  return categoryCache;
}

function toVehicleType(name: string | undefined): VehicleType {
  if (name === "cdl") return "cdl";
  if (name === "motorcycle") return "motorcycle";
  return "car";
}

/**
 * Real quizzes have no long-form description column — the closest available copy is the
 * category's description (from GET /quiz-categories), with a generated fallback sentence when
 * that's missing so the "About" section on the test-intro screen is never left blank.
 */
export async function fetchTestDetail(id: string): Promise<TodayTestDetail> {
  const { quiz } = await fetchQuiz(id);
  const categories = await getCategoriesCached();
  const categoryMeta = categories.find((c) => c.name === quiz.category?.name);

  const description =
    categoryMeta?.description ??
    `Practice questions covering ${quiz.category?.title ?? "this topic"} for ${
      quiz.vehicle_type?.title ?? "drivers"
    }${quiz.state ? ` in ${quiz.state.name}` : ""}.`;

  return {
    id: String(quiz.id),
    title: quiz.title,
    image: quiz.cover_image_url
      ? { uri: quiz.cover_image_url }
      : fallbackImage(toVehicleType(quiz.vehicle_type?.name)),
    description,
    questionsCount: quiz.total_questions,
    passingScore: quiz.passing_score_percent ?? 80,
  };
}

/**
 * Full test list for a single category's "See all" screen — same live `GET /quizzes` data and
 * filters (permit_test track, exam-simulator quizzes excluded) as the Today tab's row for this
 * category, just uncapped and without the horizontal-row limit.
 */
export async function fetchTestsByCategory(
  vehicle: VehicleType,
  state: string,
  category: string,
): Promise<TodayTestCard[]> {
  const quizzes = await fetchQuizzes({
    vehicleType: vehicle,
    state,
    category,
    testTrack: "permit_test",
    perPage: 100,
  }).catch(() => []);
  return quizzes.filter((q) => q.quiz_type?.name !== "final").map((q) => toCard(q, vehicle));
}

export interface TheoryListItem {
  id: string;
  title: string;
  description?: string;
  locked: boolean;
}

/**
 * Full cheat-sheet list for the Theory "See all" screen — same live `GET /cheat-sheets` data as
 * the Today tab's teaser row, just uncapped (the teaser only asks for/shows the first few).
 */
export async function fetchTheoryList(vehicle: VehicleType, state: string): Promise<TheoryListItem[]> {
  const sheets = await fetchCheatSheets({ vehicleType: vehicle, state, perPage: 50 }).catch(() => []);
  return sheets.map((sheet) => ({
    id: String(sheet.id),
    title: sheet.title,
    description: sheet.summary || undefined,
    locked: sheet.locked,
  }));
}
