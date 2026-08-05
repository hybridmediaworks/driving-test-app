"use client";

import { useEffect, useState } from "react";
import { useWebLayout } from "@/lib/web-layout-context";
import { fetchStateSteps, type StepsMockPhase } from "@/data/stepsMockData";

export type PhaseCompletionState = {
  phase: StepsMockPhase | null;
  /** This phase's own last step is justCompleted — a live, one-time trigger to animate in. */
  isJustFinished: boolean;
  /** Every step in this phase is completed with no live trigger — render already-filled, no animation. */
  isFullyCompleted: boolean;
};

/**
 * Shared by StatePhase (its own phase + the previous one) and PremiumCTA
 * (the phase its connectors sit right after) so "is this phase done" is
 * computed the same way everywhere instead of duplicated per component.
 */
export function usePhaseCompletion(phaseNumber: number): PhaseCompletionState {
  const { selectedState } = useWebLayout();
  const [phases, setPhases] = useState<StepsMockPhase[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchStateSteps().then((data) => {
      if (cancelled) return;
      setPhases(data);
    });

    return () => {
      cancelled = true;
    };
  }, [phaseNumber, selectedState]);

  const phase = phases?.find((p) => p.phase === phaseNumber) ?? null;
  const lastStep = phase?.steps.at(-1);
  const isJustFinished = !!lastStep?.justCompleted;
  const isFullyCompleted =
    !!phase &&
    phase.steps.length > 0 &&
    phase.steps.every((s) => s.completed && !s.justCompleted);

  return { phase, isJustFinished, isFullyCompleted };
}
