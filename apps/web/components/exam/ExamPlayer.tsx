"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicQuiz, PublicQuizQuestion, QuizAttempt } from "@driving-test-app/shared";
import AccessLostDialog, { usePremiumAccessLost } from "@/components/auth/AccessLostDialog";
import QuestionCard from "@/components/quiz/QuestionCard";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { clearExamProgress, saveExamProgress, type ExamProgress } from "@/lib/examProgress";
import ExamTimer from "./ExamTimer";

export default function ExamPlayer({
  quiz,
  questions,
  ownerKey,
  initialProgress,
  exitHref,
  onComplete,
}: {
  quiz: PublicQuiz;
  questions: PublicQuizQuestion[];
  ownerKey: string;
  initialProgress: ExamProgress | null;
  exitHref: string;
  onComplete: (attempt: QuizAttempt) => void;
}) {
  const { refreshUser } = useAuth();
  const [progressOwner] = useState(ownerKey);
  const [index, setIndex] = useState(() => Math.min(initialProgress?.index ?? 0, questions.length - 1));
  const [answers, setAnswers] = useState<Record<number, number>>(() => initialProgress?.answers ?? {});
  const [elapsedSeconds, setElapsedSeconds] = useState(() => initialProgress?.elapsedSeconds ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessLost = usePremiumAccessLost(quiz.is_premium, quiz.vehicle_type?.name);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const elapsedRef = useRef(elapsedSeconds);
  const submittingRef = useRef(false);
  const expiredRef = useRef(false);

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
        duration_seconds: elapsedRef.current,
      });
      clearExamProgress(progressOwner, quiz.id);
      onComplete(res.attempt);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        await refreshUser();
        setError("We couldn't submit your exam. Make sure you're signed in with Premium access, then try again.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to submit your exam. Please try again.");
      }
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, []);

  const paused = accessLost || submitting;

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
      if (quiz.duration_seconds != null && elapsedRef.current >= quiz.duration_seconds && !expiredRef.current) {
        expiredRef.current = true;
        void submit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, quiz.duration_seconds, submit]);

  useEffect(() => {
    if (submittingRef.current) return;
    saveExamProgress(progressOwner, quiz.id, { answers, index, elapsedSeconds });
  }, [progressOwner, quiz.id, answers, index, elapsedSeconds]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        {quiz.duration_seconds != null && (
          <ExamTimer durationSeconds={quiz.duration_seconds} remainingSeconds={quiz.duration_seconds - elapsedSeconds} />
        )}
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
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
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

      <AccessLostDialog open={accessLost} exitHref={exitHref} vehicle={quiz.vehicle_type?.name} />
    </div>
  );
}
