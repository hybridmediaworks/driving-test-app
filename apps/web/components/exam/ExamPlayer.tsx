"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicQuiz, PublicQuizQuestion, QuizAttempt } from "@driving-test-app/shared";
import QuestionCard from "@/components/quiz/QuestionCard";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import ExamTimer from "./ExamTimer";

export default function ExamPlayer({
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

  // ExamTimer only invokes its onExpire callback once, on the interval it started with on
  // mount — so submit() must be a stable function that reads current answers via a ref rather
  // than closing over `answers` directly, or an auto-submit at minute 30 would send whatever
  // `answers` was at minute 0.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submittingRef = useRef(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  function selectAnswer(answerId: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: answerId }));
  }

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<{ attempt: QuizAttempt }>(`/quizzes/${quiz.id}/attempts`, {
        answers: Object.entries(answersRef.current).map(([questionId, answerId]) => ({
          question_id: Number(questionId),
          answer_id: answerId,
        })),
        duration_seconds: Math.round((Date.now() - startedAt) / 1000),
      });
      onComplete(res.attempt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit your exam. Please try again.");
      submittingRef.current = false;
      setSubmitting(false);
    }
    // quiz.id / startedAt / onComplete are all fixed for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        {quiz.duration_seconds != null && <ExamTimer durationSeconds={quiz.duration_seconds} onExpire={submit} />}
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
        <p className="text-sm text-neutral-500">
          {answeredCount} of {questions.length} answered · exam mode, no going back
        </p>
        {isLast ? (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Finish exam"}
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
}
