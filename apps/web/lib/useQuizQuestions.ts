"use client";

import { useEffect, useState } from "react";
import type { Quiz, QuizQuestion, SampleQuizQuestion } from "@driving-test-app/shared";
import { api } from "@/lib/api";

type QuizShowResponse = {
  quiz: Quiz;
  locked: boolean;
  questions: QuizQuestion[] | null;
};

/** Shared in-flight/resolved cache keyed by quiz id — the topic breakdown and the sample-question
 * sections both want the same payload, and without this each would fire its own request. Mirrors
 * the `quizCache` in lib/useResolvedQuiz.ts. */
const questionsCache = new Map<number, Promise<QuizQuestion[]>>();

export function invalidateQuizQuestions(): void {
  questionsCache.clear();
}

/**
 * The real questions behind a quiz — GET /quizzes/{id}, which only returns them when the caller is
 * entitled to the quiz (locked premium tests come back with `questions: null`). Returns an empty
 * array until resolved, or when the quiz is locked, so callers can render nothing rather than a
 * placeholder question.
 */
export function useQuizQuestions(quizId: number | undefined): QuizQuestion[] {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;

    let promise = questionsCache.get(quizId);
    if (!promise) {
      promise = api
        .get<QuizShowResponse>(`/quizzes/${quizId}`)
        .then((res) => res.questions ?? [])
        .catch(() => []);
      questionsCache.set(quizId, promise);
    }

    promise.then((result) => {
      if (!cancelled) setQuestions(result);
    });

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  return questions;
}

/** Shared cache for the marketing-preview questions, keyed by quiz id — same reasoning as
 * `questionsCache` above. */
const sampleCache = new Map<number, Promise<SampleQuizQuestion[]>>();

export function invalidateSampleQuestions(): void {
  sampleCache.clear();
}

/**
 * A handful of this quiz's questions with the correct answer and explanation attached — GET
 * /quizzes/{id}/sample-questions, the one endpoint that reveals answers without an attempt (see
 * its controller docblock). Returns an empty array while loading, and for a quiz the caller isn't
 * entitled to, so the landing page's sample block simply doesn't render.
 */
export function useSampleQuestions(quizId: number | undefined, limit = 6): SampleQuizQuestion[] {
  const [questions, setQuestions] = useState<SampleQuizQuestion[]>([]);

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;

    let promise = sampleCache.get(quizId);
    if (!promise) {
      promise = api
        .get<{ data: SampleQuizQuestion[] }>(`/quizzes/${quizId}/sample-questions?limit=${limit}`)
        .then((res) => res.data ?? [])
        .catch(() => []);
      sampleCache.set(quizId, promise);
    }

    promise.then((result) => {
      if (!cancelled) setQuestions(result);
    });

    return () => {
      cancelled = true;
    };
  }, [quizId, limit]);

  return questions;
}
