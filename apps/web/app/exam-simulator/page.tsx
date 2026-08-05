"use client";

import type { PublicQuiz } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import QuizCard from "@/components/quiz/QuizCard";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export default function ExamSimulatorPage() {
  const { data: exams } = usePaginatedList<PublicQuiz>("/quizzes?quiz_type=final");
  const rows = exams?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-neutral-900">Exam simulator</h1>
              <p className="text-neutral-500">
                The real format: same question count, a strict clock, and a clear pass/fail result — no feedback until
                you finish.
              </p>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">No exam simulations are available yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
