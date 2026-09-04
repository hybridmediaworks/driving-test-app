"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  HazardSimulatorAttempt,
  HazardSimulatorShowResponse,
  PaginatedResponse,
  PublicHazardSimulator,
} from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PremiumDialog from "@/components/billing/PremiumDialog";
import HazardPlayer from "@/components/hazard/HazardPlayer";
import HazardResults from "@/components/hazard/HazardResults";
import HazardSimulatorIntro, { type HazardRunOptions } from "@/components/hazard/HazardSimulatorIntro";
import SimulatorCard from "@/components/hazard/SimulatorCard";
import { api, ApiError } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";

type Stage = "intro" | "playing" | "results";

function HazardSimulatorInner({ slug }: { slug: string }) {
  const router = useRouter();
  const [data, setData] = useState<HazardSimulatorShowResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("intro");
  const [attempt, setAttempt] = useState<HazardSimulatorAttempt | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [options, setOptions] = useState<HazardRunOptions>({ soundOn: true, showTutorial: true });
  const [related, setRelated] = useState<PublicHazardSimulator[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<HazardSimulatorShowResponse>(`/hazard-simulators/${slug}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // Restore the last completed run on load (e.g. after a refresh) instead of always
        // dropping back to the intro screen with no sign the simulator was already attempted.
        if (res.last_attempt) {
          setAttempt(res.last_attempt);
          setStage("results");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "This simulator isn't available right now.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Other simulators on the same state+vehicle page, for the "More…" rail below the player.
  const stateCode = data?.simulator.state?.code;
  const vehicleTypeName = data?.simulator.vehicle_type?.name;
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const params = new URLSearchParams({ per_page: "24" });
    if (stateCode) params.set("state", stateCode);
    if (vehicleTypeName) params.set("vehicle_type", vehicleTypeName);
    api
      .get<PaginatedResponse<PublicHazardSimulator>>(`/hazard-simulators?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setRelated(res.data.filter((s) => s.id !== data.simulator.id));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [data, stateCode, vehicleTypeName]);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-5 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <button onClick={() => router.push("/hazard-simulator")} className="text-sm font-medium text-blue-600">
          Back to hazard simulators
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  const { simulator, manifest } = data;
  const canPlay = !data.locked && manifest !== null && !!manifest.provider_video_id;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="home" hideNav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 lg:py-12">
          {stage === "intro" && (
            <>
              <HazardSimulatorIntro
                simulator={simulator}
                options={options}
                onOptionsChange={setOptions}
                onStart={() => (canPlay ? setStage("playing") : undefined)}
              />
              <PremiumDialog
                open={data.locked}
                onOpenChange={(open) => !open && router.push("/hazard-simulator")}
                title="Premium Hazard Simulator"
                description="Hazard-perception simulators are part of our premium library. Upgrade to run every one and get your Hazard Score."
              />
            </>
          )}

          {stage === "playing" && canPlay && manifest && (
            <HazardPlayer
              key={runKey}
              slug={slug}
              manifest={manifest}
              options={options}
              onComplete={(a) => {
                setAttempt(a);
                setStage("results");
              }}
              onExit={() => setStage("intro")}
            />
          )}

          {stage === "results" && attempt && manifest && (
            <HazardResults
              attempt={attempt}
              manifest={manifest}
              onRetry={() => {
                setAttempt(null);
                setRunKey((k) => k + 1);
                setStage("playing");
              }}
              onExit={() => setStage("intro")}
            />
          )}

          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">More Defensive Driving Hazard Simulators</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {related.map((s) => (
                  <SimulatorCard key={s.id} simulator={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function HazardSimulatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <WebLayoutProvider>
      <HazardSimulatorInner key={slug} slug={slug} />
    </WebLayoutProvider>
  );
}
