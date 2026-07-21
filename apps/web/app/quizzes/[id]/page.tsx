"use client";

import { use, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import type { QuizAttempt, QuizShowResponse } from "@driving-test-app/shared";
import ExamPlayer from "@/components/exam/ExamPlayer";
import ExamResults from "@/components/exam/ExamResults";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import QuizResults from "@/components/quiz/QuizResults";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
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
              <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                {data.quiz.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.quiz.cover_image_url} alt="" className="mx-auto max-h-48 rounded-2xl object-cover" />
                )}
                <h1 className="text-2xl font-semibold text-neutral-900">{data.quiz.title}</h1>
                <Paragraph color="muted">
                  {data.quiz.category?.title}
                  {data.quiz.state && ` · ${data.quiz.state.name}`}
                  {data.quiz.vehicle_type && ` · ${data.quiz.vehicle_type.title}`}
                </Paragraph>
                <Paragraph color="muted">
                  {data.quiz.total_questions} questions
                  {data.quiz.duration_seconds && ` · ${Math.round(data.quiz.duration_seconds / 60)} min`}
                  {isExam && data.quiz.passing_score_percent != null && ` · pass mark ${data.quiz.passing_score_percent}%`}
                </Paragraph>
                {isExam && !data.locked && (
                  <Paragraph color="muted" size="sm">
                    This is a timed exam simulation. Once started, the clock cannot be paused and questions can&apos;t be
                    revisited.
                  </Paragraph>
                )}
                {data.locked ? (
                  <div className="space-y-3 rounded-2xl bg-blue-50 p-6">
                    <Lock className="mx-auto h-8 w-8 text-amber-600" />
                    <p className="text-sm font-semibold text-neutral-900">This is a premium quiz</p>
                    <Paragraph color="muted" size="sm">
                      Upgrade to unlock this quiz and start practicing.
                    </Paragraph>
                    <Button href="/pricing">View plans</Button>
                  </div>
                ) : (
                  <Button onClick={() => setStage("playing")}>{isExam ? "Start exam" : "Start test"}</Button>
                )}
              </div>
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
