"use client";

import { useState } from "react";
import type { PublicQuiz, PublicQuizQuestion, QuizAttempt } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import QuestionCard from "./QuestionCard";

export default function QuizPlayer({
  quiz,
  questions,
  onComplete,
}: {
  quiz: PublicQuiz;
  questions: PublicQuizQuestion[];
  onComplete: (attempt: QuizAttempt) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  function selectAnswer(answerId: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: answerId }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<{ attempt: QuizAttempt }>(`/quizzes/${quiz.id}/attempts`, {
        answers: Object.entries(answers).map(([questionId, answerId]) => ({
          question_id: Number(questionId),
          answer_id: answerId,
        })),
        duration_seconds: Math.round((Date.now() - startedAt) / 1000),
      });
      onComplete(res.attempt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={question}
        index={index}
        total={questions.length}
        selectedAnswerId={answers[question.id] ?? null}
        onSelect={selectAnswer}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </Button>
        <p className="text-sm text-neutral-500">{answeredCount} of {questions.length} answered</p>
        {isLast ? (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
}
