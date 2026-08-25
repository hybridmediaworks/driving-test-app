import type { QuizAttempt } from "@driving-test-app/shared";
import { create } from "zustand";

interface LastAttemptState {
  attempt: QuizAttempt | null;
  setAttempt: (attempt: QuizAttempt) => void;
}

/**
 * Hand-off for the attempt the user *just* submitted — read by the results and review screens
 * right after `test/quiz/[id].tsx` grades it, so they don't need to re-fetch or carry the full
 * graded answers (question text, explanations, per-question correctness) through route params.
 * Deliberately not persisted — this is a one-shot relay between three screens in a single
 * navigation, not a history of past attempts (that's `store/progressStore.ts`).
 */
export const useLastAttemptStore = create<LastAttemptState>((set) => ({
  attempt: null,
  setAttempt: (attempt) => set({ attempt }),
}));
