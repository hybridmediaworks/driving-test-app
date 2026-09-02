import { api } from "@/lib/api";
import { type VehicleType } from "@/store/userStore";
import type { UserStats } from "@driving-test-app/shared";
import { fetchChallengeBank } from "./challengeBankApi";
import { fetchQuizzes } from "./quizApi";

/**
 * "Reset All Results" — wipes the user's quiz attempts (per-question answers cascade) and their
 * Challenge Bank on the server, so every backend-derived progress figure returns to zero.
 */
export async function resetAllResults(): Promise<void> {
  await api.delete("/attempts");
}

export interface ProgressSummary {
  /** 0–100 readiness estimate — the average score across the user's completed attempts. */
  passChancePercent: number;
  hasCompletedAttempts: boolean;
  practiceCompleted: number;
  practicePassed: number;
  practiceTotal: number;
  examPassed: number;
  examTotal: number;
  /** How many questions are sitting in the learner's Challenge Bank right now. */
  challengeBankCount: number;
  /** Marathon quizzes only (the dedicated "* Marathon" tests), not the whole practice pool. */
  marathonQuestionsAnswered: number;
  marathonQuestionsTotal: number;
  marathonCompleted: number;
  marathonTotal: number;
  /** First unfinished (else first) practice quiz to jump into, or null if there are none. */
  nextPracticeQuizId: string | null;
  marathonQuizId: string | null;
  examQuizId: string | null;
  examLocked: boolean;
}

// Marathon tests are dedicated long quizzes ("AL Basics Marathon", "CA Advanced Marathon", …) —
// identified by "Marathon" in the title (there's no separate quiz_type for them). They're kept out
// of the regular Practice Tests count and surfaced under their own Progress row.
const isMarathon = (title: string | undefined) => /marathon/i.test(title ?? "");

/**
 * Everything the Progress tab needs, live. Pass-chance comes from the authenticated `/me/stats`
 * average score; the per-area counts come from the `/quizzes` list, whose `attempted` /
 * `user_passed` / `total_questions` fields are already scoped to the current user when a token is
 * attached (see lib/api.ts). The quizzes list is primary — if it rejects the whole call rejects so
 * the Progress screen can show its error + retry state; the pass-chance stats degrade to null on
 * failure, so a stats hiccup alone never blanks the page.
 */
export async function fetchProgressSummary(
  vehicle: VehicleType,
  state: string,
  // Locally-recorded results (useProgressStore), keyed by quiz id. Lets the Progress tab reflect
  // tests the learner has taken even when signed out (guest attempts aren't tied to a server user),
  // and reconciles with server data for signed-in users (a quiz counts if either source has it).
  localResults?: Record<string, { score: number }>,
): Promise<ProgressSummary> {
  // Scope /me/stats to the same state + vehicle as the counts below, so the pass-chance (average
  // score) reflects the learner's readiness for *this* exam rather than a global average across
  // every state they've ever touched — keeping the whole page internally consistent.
  const statsQuery = `?state=${encodeURIComponent(state)}&vehicle_type=${encodeURIComponent(vehicle)}`;
  const [stats, quizzes, challengeBank] = await Promise.all([
    // Secondary — pass-chance is a nice-to-have; degrade to null rather than failing the page.
    api.get<UserStats>(`/me/stats${statsQuery}`).catch(() => null),
    // Primary — let a total failure reject so the screen shows an error state with retry.
    fetchQuizzes({ vehicleType: vehicle, state, testTrack: "permit_test", perPage: 100 }),
    // Secondary — Challenge Bank count for its Progress row; empty on failure.
    fetchChallengeBank().catch(() => []),
  ]);

  const nonFinal = quizzes.filter((q) => q.quiz_type?.name !== "final");
  const exams = quizzes.filter((q) => q.quiz_type?.name === "final");

  // Split the dedicated Marathon quizzes out of the regular practice pool.
  const marathons = nonFinal.filter((q) => isMarathon(q.title));
  const practice = nonFinal.filter((q) => !isMarathon(q.title));

  // Merge server per-user flags with locally-recorded results so the page works signed-out too.
  type Q = (typeof quizzes)[number];
  const attemptedAny = (q: Q) => q.attempted === true || localResults?.[String(q.id)] != null;
  const passedAny = (q: Q) => {
    if (q.user_passed === true) return true;
    const r = localResults?.[String(q.id)];
    return r != null && r.score >= (q.passing_score_percent ?? 80);
  };

  const attemptedMarathons = marathons.filter(attemptedAny);
  const average = stats?.attempts.average_score ?? null;

  const nextPractice =
    practice.find((q) => !attemptedAny(q) && !q.locked) ??
    practice.find((q) => !q.locked) ??
    practice[0] ??
    null;
  const nextMarathon =
    marathons.find((q) => !attemptedAny(q) && !q.locked) ??
    marathons.find((q) => !q.locked) ??
    marathons[0] ??
    null;
  const firstExam = exams[0] ?? null;

  return {
    passChancePercent: average === null ? 0 : Math.round(average),
    hasCompletedAttempts:
      (stats?.attempts.completed ?? 0) > 0 || Object.keys(localResults ?? {}).length > 0,
    practiceCompleted: practice.filter(attemptedAny).length,
    practicePassed: practice.filter(passedAny).length,
    practiceTotal: practice.length,
    examPassed: exams.filter(passedAny).length,
    examTotal: exams.length,
    challengeBankCount: challengeBank.length,
    marathonQuestionsAnswered: attemptedMarathons.reduce((sum, q) => sum + q.total_questions, 0),
    marathonQuestionsTotal: marathons.reduce((sum, q) => sum + q.total_questions, 0),
    marathonCompleted: attemptedMarathons.length,
    marathonTotal: marathons.length,
    nextPracticeQuizId: nextPractice ? String(nextPractice.id) : null,
    marathonQuizId: nextMarathon ? String(nextMarathon.id) : null,
    examQuizId: firstExam ? String(firstExam.id) : null,
    examLocked: firstExam?.locked ?? false,
  };
}
