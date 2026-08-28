import { api } from "@/lib/api";
import type { PublicQuizQuestion } from "@driving-test-app/shared";

/**
 * A saved Challenge Bank question. Same shape as a normal quiz question, plus `quiz_id` so the
 * client can grade an answer against the question's original quiz via the existing
 * `POST /quizzes/{quiz}/questions/{question}/check` endpoint.
 */
export type ChallengeBankQuestion = PublicQuizQuestion & { quiz_id: number };

/** The current user's Challenge Bank questions (newest first). Requires auth. */
export async function fetchChallengeBank(): Promise<ChallengeBankQuestion[]> {
  const res = await api.get<{ data: ChallengeBankQuestion[] }>("/challenge-bank");
  return res.data;
}

/** Manually add questions (the grader adds wrong answers automatically on its own). */
export async function addToChallengeBank(questionIds: number[]): Promise<void> {
  await api.post("/challenge-bank", { question_ids: questionIds });
}

/** Remove a question — called once the learner finally answers it correctly. */
export async function removeFromChallengeBank(questionId: number): Promise<void> {
  await api.delete(`/challenge-bank/${questionId}`);
}
