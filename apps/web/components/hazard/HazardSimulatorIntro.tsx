"use client";

import { Car, Clock, Footprints, Gauge, MapPin, SignpostBig, TrafficCone } from "lucide-react";
import type { HazardType, PublicHazardSimulator } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";

export type HazardRunOptions = { soundOn: boolean; showTutorial: boolean };

const CATEGORY_META: Record<HazardType, { label: string; icon: typeof Car }> = {
  vehicle: { label: "Vehicles", icon: Car },
  pedestrian: { label: "Pedestrians", icon: Footprints },
  sign: { label: "Signs", icon: SignpostBig },
  signal: { label: "Signals", icon: TrafficCone },
  road_mark: { label: "Road marks", icon: TrafficCone },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Start screen — difficulty / length / location chips, the hazard categories present in this
 * clip, and the two toggles (sound, tutorial walkthrough). Mirrors the reference intro card.
 */
export default function HazardSimulatorIntro({
  simulator,
  options,
  onOptionsChange,
  onStart,
}: {
  simulator: PublicHazardSimulator;
  options: HazardRunOptions;
  onOptionsChange: (next: HazardRunOptions) => void;
  onStart: () => void;
}) {
  const categories = simulator.categories ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-border bg-white p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Hazard Perception</p>
        <h1 className="text-2xl font-semibold text-neutral-900">{simulator.title}</h1>
        {simulator.description && <p className="text-neutral-500">{simulator.description}</p>}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {simulator.test_level && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
            <Gauge className="h-4 w-4" /> {simulator.test_level}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
          <Clock className="h-4 w-4" /> {formatDuration(simulator.duration_seconds)} min
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
          {simulator.hazard_count} hazards
        </span>
        {simulator.test_location && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
            <MapPin className="h-4 w-4" /> {simulator.test_location}
          </span>
        )}
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">Watch for</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const meta = CATEGORY_META[c];
              const Icon = meta?.icon ?? Car;
              return (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                >
                  <Icon className="h-4 w-4" /> {meta?.label ?? c}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-xl bg-neutral-50 p-4">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-800">Sound &amp; narration</span>
          <Switch
            checked={options.soundOn}
            onCheckedChange={(soundOn) => onOptionsChange({ ...options, soundOn })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-800">
            Show the first {simulator.demo_hazard_count} hazards with hints
          </span>
          <Switch
            checked={options.showTutorial}
            onCheckedChange={(showTutorial) => onOptionsChange({ ...options, showTutorial })}
          />
        </label>
      </div>

      <Button onClick={onStart} className="w-full">
        Start Simulator
      </Button>
    </div>
  );
}
