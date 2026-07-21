"use client";

import { useState } from "react";
import type { PublicQuizQuestion, QuizAttempt } from "@driving-test-app/shared";
import QuizResults from "@/components/quiz/QuizResults";
import { Button } from "@/components/ui/ShadcnButton";
import { api, ApiError } from "@/lib/api";

/**
 * A single attempt row with an expandable full review — shared by "My Results" and the admin
 * all-users results list so the review-loading logic only lives in one place.
 */
export default function AttemptRow({ attempt, showUser = false }: { attempt: QuizAttempt; showUser?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [questions, setQuestions] = useState<PublicQuizQuestion[] | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggleReview() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    if (questions || reviewError) return;

    setLoading(true);
    try {
      const res = await api.get<{ questions: PublicQuizQuestion[] }>(`/quizzes/${attempt.quiz_id}`);
      setQuestions(res.questions);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "This quiz is no longer available for a full review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{attempt.quiz?.title ?? `Quiz #${attempt.quiz_id}`}</p>
          {showUser && (
            <p className="text-sm text-muted-foreground">
              {attempt.user ? `${attempt.user.name} · ${attempt.user.email}` : "Guest attempt"}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {attempt.quiz?.category && `${attempt.quiz.category} · `}
            {attempt.correct_count}/{attempt.total_questions} correct · {Math.round(attempt.score)}%
            {attempt.completed_at && ` · ${new Date(attempt.completed_at).toLocaleDateString()}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleReview}>
          {expanded ? "Hide review" : "Review"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4">
          {loading && <p className="text-sm text-muted-foreground">Loading review…</p>}
          {reviewError && <p className="text-sm text-muted-foreground">{reviewError}</p>}
          {questions && <QuizResults attempt={attempt} questions={questions} quizId={attempt.quiz_id} />}
        </div>
      )}
    </li>
  );
}
