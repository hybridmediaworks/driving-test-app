"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicQuizQuestion } from "@driving-test-app/shared";
import { api } from "@/lib/api";

/**
 * A question saved in the learner's Quiz Vault. Same pre-submission shape as a quiz question — no
 * explanation until an answer is checked — plus `quiz_id`, so a client can grade an answer against
 * the quiz the question came from.
 */
export type ChallengeBankQuestion = PublicQuizQuestion & {
  quiz_id: number;
  /** Got wrong and not yet got right. Set and cleared by the grader. */
  missed: boolean;
  /** Saved by hand with the bookmark. Both can be true for the same question. */
  bookmarked: boolean;
};

/**
 * The learner's Quiz Vault ("Challenge Bank" server-side) — GET/POST/DELETE /challenge-bank.
 *
 * The server already fills this on its own: grading an attempt files every question answered wrong
 * and removes any finally answered right (see GradeQuizAttempt). This hook adds the other half —
 * the questions a learner saves by hand with the bookmark — and reads the whole lot back.
 *
 * The same endpoints serve a signed-out guest via their `X-Guest-Token`, and their bank is claimed
 * into the account when they log in, so nothing a guest banked is lost at signup.
 */
async function fetchBank(): Promise<ChallengeBankQuestion[]> {
  const res = await api.get<{ data: ChallengeBankQuestion[] }>(
    "/challenge-bank",
  );
  return res.data;
}

export function useChallengeBank() {
  const [questions, setQuestions] = useState<ChallengeBankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // Bumped to ask for the bank again; the fetch itself stays inside the effect, where state is only
  // written from the promise's callbacks (same shape as lib/useStateStats.ts).
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchBank()
      .then((data) => {
        if (cancelled) return;
        setQuestions(data);
        setFailed(false);
      })
      .catch(() => {
        // Keep whatever is already on screen rather than blanking it — offline, or a token that
        // expired mid-session. `failed` lets the caller say so instead of claiming an empty vault.
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloads]);

  const refresh = useCallback(() => setReloads((n) => n + 1), []);

  /** Save a question. Idempotent server-side, so re-adding one already banked is harmless. */
  const add = useCallback(async (questionId: number) => {
    await api.post("/challenge-bank", { question_ids: [questionId] });
  }, []);

  /** Drop a question from the vault for good — both reasons it might be there. */
  const remove = useCallback(async (questionId: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    await api.delete(`/challenge-bank/${questionId}`);
  }, []);

  return { questions, loading, failed, refresh, add, remove } as const;
}
