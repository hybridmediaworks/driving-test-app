"use client";

import { use, useEffect, useState } from "react";
import type { QuizAttempt, QuizShowResponse } from "@driving-test-app/shared";
import ExamPlayer from "@/components/exam/ExamPlayer";
import ExamResults from "@/components/exam/ExamResults";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import QuizPreview from "@/components/quiz/QuizPreview";
import QuizResults from "@/components/quiz/QuizResults";
import { api, ApiError } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";

type Stage = "preview" | "playing" | "results";

export default function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<QuizShowResponse | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("preview");
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    api
      .get<QuizShowResponse>(`/quizzes/${id}`)
      .then(setData)
      .catch((err) => setNotFoundError(err instanceof ApiError ? err.message : "This quiz isn't available."));
  }, [id]);

  const isExam = data?.quiz.quiz_type?.name === "final";

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl space-y-6 px-5 py-10 lg:py-14">
            {notFoundError && <p className="text-center text-sm text-destructive">{notFoundError}</p>}

            {!data && !notFoundError && <p className="text-center text-sm text-neutral-500">Loading…</p>}

            {data && stage === "preview" && (
              <QuizPreview data={data} isExam={isExam} onStart={() => setStage("playing")} />
            )}

            {data && data.questions && stage === "playing" && isExam && (
              <ExamPlayer
                quiz={data.quiz}
                questions={data.questions}
                onComplete={(a) => {
                  setAttempt(a);
                  setStage("results");
                }}
              />
            )}

            {data && data.questions && stage === "playing" && !isExam && (
              <QuizPlayer
                quiz={data.quiz}
                questions={data.questions}
                onComplete={(a) => {
                  setAttempt(a);
                  setStage("results");
                }}
              />
            )}

            {data && data.questions && stage === "results" && attempt && isExam && (
              <ExamResults attempt={attempt} questions={data.questions} quizId={data.quiz.id} />
            )}

            {data && data.questions && stage === "results" && attempt && !isExam && (
              <QuizResults attempt={attempt} questions={data.questions} quizId={data.quiz.id} />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
