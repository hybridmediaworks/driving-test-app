"use client";

import { Suspense } from "react";
import type { PublicCheatSheet } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BrowseFilters from "@/components/browse/BrowseFilters";
import BrowseGrid from "@/components/browse/BrowseGrid";
import BrowseHeader from "@/components/browse/BrowseHeader";
import CheatSheetCard from "@/components/cheat-sheet/CheatSheetCard";
import Paginator from "@/components/ui/Paginator";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function CheatSheetsBrowseInner() {
  const { searchParams, filterQuery, page, updateFilter, updateFilters, setPage } = useUrlQuery();

  const { data: cheatSheets, loading } = usePaginatedList<PublicCheatSheet>(
    `/cheat-sheets${filterQuery ? `?${filterQuery}` : ""}`,
    page,
  );

  const rows = cheatSheets?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <BrowseHeader
              title="Cheat sheets"
              description="Condensed, high-yield study guides — read online or download as PDF."
              total={cheatSheets?.meta.total ?? null}
              unit="cheat sheets"
            />

            <BrowseFilters
              fields={["state", "vehicle_type", "category"]}
              searchParams={searchParams}
              updateFilter={updateFilter}
              updateFilters={updateFilters}
              loading={loading}
              searchPlaceholder="Search cheat sheets"
            />

            <BrowseGrid
              loading={loading}
              count={rows.length}
              skeletonHasImage
              emptyTitle="No cheat sheets match those filters"
              emptyHint="Try a different state or vehicle type, or clear the filters to see everything."
            >
              {rows.map((sheet) => (
                <CheatSheetCard key={sheet.id} sheet={sheet} />
              ))}
            </BrowseGrid>

            {cheatSheets && cheatSheets.meta.total > 0 && <Paginator meta={cheatSheets.meta} onPageChange={setPage} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function CheatSheetsBrowsePage() {
  return (
    <Suspense>
      <CheatSheetsBrowseInner />
    </Suspense>
  );
}
