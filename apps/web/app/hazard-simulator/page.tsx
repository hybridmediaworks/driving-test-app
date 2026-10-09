"use client";

import { Suspense } from "react";
import type { PublicHazardSimulator } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BrowseFilters from "@/components/browse/BrowseFilters";
import BrowseGrid from "@/components/browse/BrowseGrid";
import BrowseHeader from "@/components/browse/BrowseHeader";
import SimulatorCard from "@/components/hazard/SimulatorCard";
import Paginator from "@/components/ui/Paginator";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";
import { WebLayoutProvider } from "@/lib/web-layout-context";

function HazardSimulatorBrowseInner() {
  const { searchParams, filterQuery, page, updateFilter, updateFilters, setPage } = useUrlQuery();

  // Paginated like every other browse page. It used to ask for 60 on page one and show nothing
  // else, which quietly put the other six hundred simulators out of reach.
  const { data, loading } = usePaginatedList<PublicHazardSimulator>(
    `/hazard-simulators${filterQuery ? `?${filterQuery}` : ""}`,
    page,
  );

  const rows = data?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <BrowseHeader
              title="Hazard perception simulators"
              description="Watch realistic driving footage and spot developing hazards under a timer — a guided walkthrough first, then a scored round with your Hazard Score at the end."
              total={data?.meta.total ?? null}
              unit="simulators"
            />

            <BrowseFilters
              fields={["state", "vehicle_type"]}
              searchParams={searchParams}
              updateFilter={updateFilter}
              updateFilters={updateFilters}
              loading={loading}
              searchPlaceholder="Search simulators"
            />

            <BrowseGrid
              loading={loading}
              count={rows.length}
              skeletonHasImage
              emptyTitle="No simulators match those filters"
              emptyHint="Try a different state or vehicle type, or clear the filters to see everything."
            >
              {rows.map((simulator) => (
                <SimulatorCard key={simulator.id} simulator={simulator} />
              ))}
            </BrowseGrid>

            {data && data.meta.total > 0 && <Paginator meta={data.meta} onPageChange={setPage} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function HazardSimulatorIndexPage() {
  return (
    <Suspense>
      <HazardSimulatorBrowseInner />
    </Suspense>
  );
}
