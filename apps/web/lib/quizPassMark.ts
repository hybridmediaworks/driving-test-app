import type { Quiz } from "@driving-test-app/shared";

/**
 * The app-wide default pass line used when a quiz has no explicit `passing_score_percent`. Mirrors
 * the API — `GradeQuizAttempt` and `QuizResource::user_passed` both fall back to 80 — so the pass
 * mark shown on the marketing page is the one an attempt is actually graded against.
 */
export const DEFAULT_PASSING_SCORE_PERCENT = 80;

export function passingScorePercent(quiz: Pick<Quiz, "passing_score_percent">): number {
  return quiz.passing_score_percent ?? DEFAULT_PASSING_SCORE_PERCENT;
}

/** How many of a quiz's questions must be right to pass it. */
export function questionsToPass(quiz: Pick<Quiz, "passing_score_percent" | "total_questions">): number {
  return Math.ceil((quiz.total_questions * passingScorePercent(quiz)) / 100);
}
