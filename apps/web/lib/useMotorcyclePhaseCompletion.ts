"use client";

import { useEffect, useState } from "react";
import { useWebLayout } from "@/lib/web-layout-context";
import {
  fetchMotorcycleSteps,
  type StepsMockPhase,
} from "@/data/motorcycleStepsMockData";
import type { PhaseCompletionState } from "@/lib/usePhaseCompletion";

/**
 * Same shape and role as usePhaseCompletion, but reads the motorcycle steps
 * mock data instead of the car/state one — kept separate so StatePhase's car
 * flow and MotorcyclePhase's flow can evolve independently once real
 * endpoints per vehicle type exist.
 */
export function useMotorcyclePhaseCompletion(
  phaseNumber: number,
): PhaseCompletionState {
  const { selectedState } = useWebLayout();
  const [phases, setPhases] = useState<StepsMockPhase[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchMotorcycleSteps().then((data) => {
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
