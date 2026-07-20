"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicQuizQuestion, QuizAttempt } from "@driving-test-app/shared";
import AppLayout from "@/components/app/AppLayout";
import QuizResults from "@/components/quiz/QuizResults";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { api, ApiError } from "@/lib/api";
import { usePaginatedList } from "@/hooks/use-paginated-list";

function AttemptRow({ attempt }: { attempt: QuizAttempt }) {
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

export default function AttemptHistoryPage() {
  const { data: attempts } = usePaginatedList<QuizAttempt>("/attempts");
  const rows = attempts?.data ?? [];

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "My Results", href: "/dashboard/attempts" }]}>
      <div className="app-page">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold">My results</h1>
          <p className="text-sm text-muted-foreground">Your quiz attempt history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Attempts <span className="font-normal text-muted-foreground">({attempts?.meta.total ?? 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No attempts yet. <Link href="/quizzes" className="underline">Take a practice test</Link> to get started.
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-md border">
                {rows.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} />
                ))}
              </ul>
            )}
            {attempts && attempts.meta.total > 0 && <Paginator meta={attempts.meta} />}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
