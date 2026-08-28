"use client";

import { useEffect, useState } from "react";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateAbbreviations } from "@/lib/usStates";
import { fetchPhaseLadder, resolveNextQuizSlug, type PhaseLadderPhase } from "@/lib/phaseLadder";

export type PhaseCompletionState = {
  phase: PhaseLadderPhase | null;
  /** This phase's own last step is justCompleted — a live, one-time trigger to animate in. */
  isJustFinished: boolean;
  /** Every step in this phase is completed with no live trigger — render already-filled, no animation. */
  isFullyCompleted: boolean;
};

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/**
 * Shared by StatePhase (its own phase + the previous one) and PremiumCTA (the phase its
 * connectors sit right after) so "is this phase done" is computed the same way everywhere
 * instead of duplicated per component. Reads state/vehicle/test-track from WebLayoutProvider
 * itself (rather than taking them as arguments) so this one hook serves every
 * state/vehicle/track combination — the car-only vs motorcycle-only hook split this replaced
 * only existed because the old mock data had no vehicle dimension to key off of.
 */
export function usePhaseCompletion(phaseNumber: number): PhaseCompletionState {
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const [phases, setPhases] = useState<PhaseLadderPhase[] | null>(null);

  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  useEffect(() => {
    if (!stateCode) return;

    let cancelled = false;

    fetchPhaseLadder(stateCode, vehicleType, selectedTestType).then((data) => {
      if (cancelled) return;
      setPhases(data);
    });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, selectedTestType]);

  const phase = phases?.find((p) => p.phase === phaseNumber) ?? null;
  const lastStep = phase?.steps.at(-1);
  const isJustFinished = !!lastStep?.justCompleted;
  const isFullyCompleted =
    !!phase &&
    phase.steps.length > 0 &&
    phase.steps.every((s) => s.completed && !s.justCompleted);

  return { phase, isJustFinished, isFullyCompleted };
}

/**
 * The list of real phase numbers for the current state/vehicle/test-track — the phase ladder's
 * length now genuinely varies per combination (a category with no quizzes for this combination
 * produces no phase), so callers rendering the ladder need this instead of assuming a fixed
 * count. Shares the same request cache as usePhaseCompletion (same fetchPhaseLadder call).
 */
export function usePhaseNumbers(): number[] {
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const [phases, setPhases] = useState<PhaseLadderPhase[] | null>(null);

  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  useEffect(() => {
    if (!stateCode) return;

    let cancelled = false;

    fetchPhaseLadder(stateCode, vehicleType, selectedTestType).then((data) => {
      if (cancelled) return;
      setPhases(data);
    });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, selectedTestType]);

  return phases?.map((p) => p.phase) ?? [];
}

/**
 * The slug of the quiz the learner should start/continue with for the current state+vehicle and
 * the given test track — what the state-page Hero's "Start" button should link to instead of the
 * generic browse-all-tests page. Null until resolved (or if the ladder has no real steps at all);
 * callers should fall back to their own safe default href in that case. Shares fetchPhaseLadder's
 * cache with the rest of the ladder (usePhaseCompletion/usePhaseNumbers), so this costs no extra
 * request when rendered on the same page as PhaseLadderSection.
 */
export function useNextQuizSlug(testTrack: "permit_test" | "driving_test"): string | null {
  const { selectedState, selectedVehicle } = useWebLayout();
  const [slug, setSlug] = useState<string | null>(null);

  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  useEffect(() => {
    if (!stateCode) return;

    let cancelled = false;

    resolveNextQuizSlug(stateCode, vehicleType, testTrack).then((result) => {
      if (!cancelled) setSlug(result);
    });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, testTrack]);

  return slug;
}
