"use client";

import type { PublicHazardSimulator } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SimulatorCard from "@/components/hazard/SimulatorCard";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export default function HazardSimulatorIndexPage() {
  const { data } = usePaginatedList<PublicHazardSimulator>("/hazard-simulators?per_page=60", 1);
  const rows = data?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-neutral-900">Hazard perception simulators</h1>
              <p className="text-neutral-500">
                Watch realistic driving footage and spot developing hazards under a timer — a guided
                walkthrough first, then a scored round with your Hazard Score at the end.
              </p>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">No hazard simulators are available yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((simulator) => (
                  <SimulatorCard key={simulator.id} simulator={simulator} />
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
