"use client";

import StatePhase from "@/components/state/StatePhase";
import HandbookPhase from "@/components/state/HandbookPhase";
import { usePhaseNumbers } from "@/lib/usePhaseCompletion";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateToSlug } from "@/lib/usStates";

/**
 * The dynamic replacement for the old hardcoded "phase 1 through 7" JSX — the real ladder length
 * varies per state/vehicle/test-track (a category with no quizzes for this combination produces
 * no phase at all), so this renders however many real phases exist instead of assuming a fixed
 * count.
 */
export default function PhaseLadderSection() {
  const phaseNumbers = usePhaseNumbers();
  const { selectedState } = useWebLayout();
  const stateSlug = selectedState ? stateToSlug(selectedState) : undefined;

  if (phaseNumbers.length === 0) return null;

  return (
    <section className="md:px-15 px-5 pt-15 pb-15 lg:pt-30 lg:pb-15 bg-background2">
      <div className="mx-auto max-w-container space-y-12">
        {phaseNumbers.map((phase, index) => (
          <StatePhase
            key={phase}
            phase={phase}
            state={stateSlug}
            /* Every phase after the first connects up to the one before it. */
            previousConnector={index > 0}
            /* The handbook rung always follows the last phase, so every phase connects downward. */
            nextConnector
          />
        ))}
        {/* Handbook is the final numbered rung, then the "end of theory prep" milestone. */}
        <HandbookPhase phaseNumber={phaseNumbers.length + 1} />
      </div>
    </section>
  );
}
