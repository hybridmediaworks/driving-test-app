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
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function QuizzesBrowseInner() {
  const { searchParams, filterQuery, page, updateFilter, updateFilters, setPage } = useUrlQuery();

  const { data: quizzes, loading } = usePaginatedList<PublicQuiz>(`/quizzes${filterQuery ? `?${filterQuery}` : ""}`, page);

  const rows = quizzes?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <BrowseHeader
              title="Practice tests"
              description="Free to take — no account required. Sign up to save your results."
              total={quizzes?.meta.total ?? null}
              unit="tests"
            />

            <BrowseFilters
              fields={["state", "vehicle_type", "test_track", "category"]}
              searchParams={searchParams}
              updateFilter={updateFilter}
              updateFilters={updateFilters}
              loading={loading}
              searchPlaceholder="Search practice tests"
            />

            <BrowseGrid
              loading={loading}
              count={rows.length}
              emptyTitle="No tests match those filters"
              emptyHint="Try a different state or vehicle type, or clear the filters to see everything."
            >
              {rows.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </BrowseGrid>

            {quizzes && quizzes.meta.total > 0 && <Paginator meta={quizzes.meta} onPageChange={setPage} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function QuizzesBrowsePage() {
  return (
    <Suspense>
      <QuizzesBrowseInner />
    </Suspense>
  );
}
