"use client";

import { useEffect } from "react";
import { Car, Footprints, SignpostBig, TrafficCone, Check } from "lucide-react";
import type { HazardType } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";

const TYPE_ICON: Record<HazardType, typeof Car> = {
  vehicle: Car,
  pedestrian: Footprints,
  sign: SignpostBig,
  signal: TrafficCone,
  road_mark: TrafficCone,
};

/**
 * The pause-and-explain card. Shown when a demo hazard resolves during the walkthrough, and when
 * a hazard is spotted during the scored round. Plays the narration MP3 (when sound is on) and
 * blocks on a Continue press before the clip resumes — mirrors the reference exercise.
 */
export default function HazardFeedbackCard({
  typeLabel,
  type,
  comment,
  audioUrl,
  soundOn,
  phase,
  onContinue,
}: {
  typeLabel: string;
  type: HazardType;
  comment: string | null;
  audioUrl: string | null;
  soundOn: boolean;
  phase: "demo" | "assessment";
  onContinue: () => void;
}) {
  const Icon = TYPE_ICON[type] ?? Car;

  useEffect(() => {
    if (!soundOn || !audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      /* autoplay blocked — the on-screen text still carries the feedback */
    });
    return () => {
      audio.pause();
    };
  }, [audioUrl, soundOn]);

  // Enter / Space anywhere on the card also continues, so a keyboard user isn't forced to tab.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  return (
    <div
      role="dialog"
      aria-label={`${typeLabel} hazard feedback`}
      className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {phase === "demo" ? "Tutorial hazard" : "Hazard spotted"}
            </p>
            <p className="flex items-center gap-1.5 font-semibold text-neutral-900">
              <Icon className="h-4 w-4 text-blue-600" /> {typeLabel}
            </p>
          </div>
        </div>

        <p className="text-neutral-700">{comment ?? "Well spotted — keep watching for the next one."}</p>

        <Button onClick={onContinue} className="w-full" size="md">
          Continue
        </Button>
      </div>
    </div>
  );
}
