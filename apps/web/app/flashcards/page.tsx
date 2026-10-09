"use client";

import { Suspense } from "react";
import type { PublicFlashcard } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BrowseFilters from "@/components/browse/BrowseFilters";
import BrowseGrid from "@/components/browse/BrowseGrid";
import BrowseHeader from "@/components/browse/BrowseHeader";
import FlashcardCard from "@/components/flashcards/FlashcardCard";
import Button from "@/components/ui/Button";
import Paginator from "@/components/ui/Paginator";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function FlashcardsBrowseInner() {
  const { searchParams, filterQuery, page, updateFilter, updateFilters, setPage } = useUrlQuery();

  const { data: flashcards, loading } = usePaginatedList<PublicFlashcard>(
    `/flashcards${filterQuery ? `?${filterQuery}` : ""}`,
    page,
  );

  const rows = flashcards?.data ?? [];
  // Carries the filters through, so you study exactly the deck you were just looking at.
  const studyHref = `/flashcards/study${filterQuery ? `?${filterQuery}` : ""}`;

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <BrowseHeader
              title="Flashcards"
              description="Quick recall practice for signs, rules, and terms."
              total={flashcards?.meta.total ?? null}
              unit="cards"
              action={<Button href={studyHref}>Start studying</Button>}
            />

            <BrowseFilters
              fields={["state", "vehicle_type", "category"]}
              searchParams={searchParams}
              updateFilter={updateFilter}
              updateFilters={updateFilters}
              loading={loading}
              searchPlaceholder="Search flashcards"
            />

            <BrowseGrid
              loading={loading}
              count={rows.length}
              emptyTitle="No flashcards match those filters"
              emptyHint="Try a different state or vehicle type, or clear the filters to see everything."
            >
              {rows.map((card) => (
                <FlashcardCard key={card.id} card={card} studyHref={studyHref} />
              ))}
            </BrowseGrid>

            {flashcards && flashcards.meta.total > 0 && <Paginator meta={flashcards.meta} onPageChange={setPage} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function FlashcardsBrowsePage() {
  return (
    <Suspense>
      <FlashcardsBrowseInner />
    </Suspense>
  );
}
