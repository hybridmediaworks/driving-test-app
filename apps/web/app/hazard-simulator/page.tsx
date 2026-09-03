"use client";

import Link from "next/link";
import { Gauge, Lock, MapPin } from "lucide-react";
import type { PublicHazardSimulator } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { WebLayoutProvider } from "@/lib/web-layout-context";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")} min`;
}

function SimulatorCard({ simulator }: { simulator: PublicHazardSimulator }) {
  return (
    <Link
      href={`/hazard-simulator/${simulator.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
        {simulator.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={simulator.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute left-2 top-2 rounded-sm bg-orange-500 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          Premium
        </span>
        {simulator.locked && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
            <Lock className="h-6 w-6 text-blue-700" />
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="font-semibold text-neutral-900">{simulator.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="font-semibold text-blue-500">{simulator.hazard_count} hazards</span>
          {simulator.duration_seconds ? <span>{formatDuration(simulator.duration_seconds)}</span> : null}
          {simulator.test_level && (
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {simulator.test_level}
            </span>
          )}
          {simulator.test_location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {simulator.test_location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

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
