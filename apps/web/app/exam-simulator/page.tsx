"use client";

import { Suspense } from "react";
import type { PublicQuiz } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BrowseFilters from "@/components/browse/BrowseFilters";
import BrowseGrid from "@/components/browse/BrowseGrid";
import BrowseHeader from "@/components/browse/BrowseHeader";
import QuizCard from "@/components/quiz/QuizCard";
import Paginator from "@/components/ui/Paginator";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";
import { WebLayoutProvider } from "@/lib/web-layout-context";

function ExamSimulatorBrowseInner() {
  const { searchParams, filterQuery, page, updateFilter, updateFilters, setPage } = useUrlQuery();

  // `quiz_type=final` is what makes this page the exam simulator rather than the practice list, so
  // it is fixed here and the learner's own filters are appended to it. There used to be no
  // pagination at all, which showed the first fifteen of several hundred exams and no way on.
  const { data: exams, loading } = usePaginatedList<PublicQuiz>(
    `/quizzes?quiz_type=final${filterQuery ? `&${filterQuery}` : ""}`,
    page,
  );

  const rows = exams?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <BrowseHeader
              title="Exam simulator"
              description="The real format: same question count, a strict clock, and a clear pass/fail result — no feedback until you finish."
              total={exams?.meta.total ?? null}
              unit="exams"
            />

            <BrowseFilters
              fields={["state", "vehicle_type", "test_track"]}
              searchParams={searchParams}
              updateFilter={updateFilter}
              updateFilters={updateFilters}
              loading={loading}
              searchPlaceholder="Search exams"
            />

            <BrowseGrid
              loading={loading}
              count={rows.length}
              emptyTitle="No exams match those filters"
              emptyHint="Try a different state or vehicle type, or clear the filters to see everything."
            >
              {rows.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </BrowseGrid>

            {exams && exams.meta.total > 0 && <Paginator meta={exams.meta} onPageChange={setPage} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function ExamSimulatorPage() {
  return (
    <Suspense>
      <ExamSimulatorBrowseInner />
    </Suspense>
  );
}
