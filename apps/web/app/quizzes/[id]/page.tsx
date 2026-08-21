"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaginatedResponse, PublicQuiz, QuizAttempt, QuizShowResponse } from "@driving-test-app/shared";
import ExamPlayer from "@/components/exam/ExamPlayer";
import ExamResults from "@/components/exam/ExamResults";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import QuizPreview from "@/components/quiz/QuizPreview";
import QuizExperience from "@/components/state/quiz/QuizExperience";
import { api, ApiError } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";

type ExamStage = "preview" | "playing" | "results";

function QuizDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<QuizShowResponse | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [examStage, setExamStage] = useState<ExamStage>("preview");
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<QuizShowResponse>(`/quizzes/${id}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setNotFoundError(err instanceof ApiError ? err.message : "This quiz isn't available.");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Continue → the next quiz in the same category/state/vehicle type as this one, mirroring the
  // state-page quiz flow (see [state]/[test-slug]/quiz). Falls back to the browse page when
  // there's no next quiz, or when the lookup fails.
  async function goToNextQuiz() {
    const quiz = data?.quiz;
    if (!quiz) return router.push("/quizzes");
    try {
      const params = new URLSearchParams({ per_page: "100" });
      if (quiz.state?.code) params.set("state", quiz.state.code);
      if (quiz.vehicle_type?.name) params.set("vehicle_type", quiz.vehicle_type.name);
      if (quiz.category?.name) params.set("category", quiz.category.name);

      const res = await api.get<PaginatedResponse<PublicQuiz>>(`/quizzes?${params.toString()}`);
      const list = res.data;
      const idx = list.findIndex((q) => q.id === quiz.id);
      const next = idx >= 0 ? list[idx + 1] : undefined;

      if (!next) router.push("/quizzes");
      else if (next.locked) router.push("/pricing");
      else router.push(`/quizzes/${next.id}`);
    } catch {
      router.push("/quizzes");
    }
  }

  if (!data && !notFoundError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
        <p className="text-sm text-destructive">{notFoundError}</p>
      </div>
    );
  }

  // Exam simulations (timed, no revisiting questions, pass/fail only at the end) are a
  // deliberately different mode from practice quizzes and keep their own dedicated flow.
  const isExam = data.quiz.quiz_type?.name === "final";

  if (isExam) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl space-y-6 px-5 py-10 lg:py-14">
            {examStage === "preview" && (
              <QuizPreview data={data} isExam onStart={() => setExamStage("playing")} />
            )}

            {data.questions && examStage === "playing" && (
              <ExamPlayer
                quiz={data.quiz}
                questions={data.questions}
                onComplete={(a) => {
                  setAttempt(a);
                  setExamStage("results");
                }}
              />
            )}

            {data.questions && examStage === "results" && attempt && (
              <ExamResults attempt={attempt} questions={data.questions} quizId={data.quiz.id} />
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <QuizExperience
      quiz={data.quiz}
      data={data}
      locked={data.locked}
      title={data.quiz.state ? `${data.quiz.state.name} ${data.quiz.title}` : data.quiz.title}
      notFoundHref="/quizzes"
      notFoundLabel="Back to quizzes"
      exitHref="/quizzes"
      stateName={data.quiz.state?.name}
      stateCode={data.quiz.state?.code}
      onContinue={goToNextQuiz}
    />
  );
}

export default function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <WebLayoutProvider>
      {/* key by id so moving to another quiz (Continue → next) starts with a clean state. */}
      <QuizDetailInner key={id} id={id} />
    </WebLayoutProvider>
  );
}
