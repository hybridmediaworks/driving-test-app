"use client";

import StatePhase from "@/components/state/StatePhase";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateToSlug } from "@/lib/usStates";

/**
 * Phases the state-hub redesign renders as their own full-width sections further down the page
 * (Figma nodes 4147:8254 and 4147:8283) instead of as rungs in this ladder — the design's ladder
 * stops after the three quiz phases. Matched on the real category title, the same way
 * lib/phaseLadder.ts already special-cases "The extra support" when ordering categories.
 */
const PROMOTED_TO_OWN_SECTION = ["The exam simulator", "The extra support"];

/**
 * The dynamic replacement for the old hardcoded "phase 1 through 7" JSX — the real ladder length
 * varies per state/vehicle/test-track (a category with no quizzes for this combination produces
 * no phase at all), so this renders however many real phases exist instead of assuming a fixed
 * count.
 *
 * The handbook used to render as an extra rung at the bottom; the redesign pulls it out into its
 * own "Explore the … Driver's Handbook" section, so the ladder now ends with its last quiz phase.
 */
export default function PhaseLadderSection() {
  const phases = useLadderPhases();
  const { selectedState } = useWebLayout();
  const stateSlug = selectedState ? stateToSlug(selectedState) : undefined;

  const ladderPhases = phases.filter(
    (p) => !PROMOTED_TO_OWN_SECTION.includes(p.header.headerTitle),
  );

  if (ladderPhases.length === 0) return null;

  return (
    <section className="md:px-15 px-5 pt-15 pb-15 lg:pt-30 lg:pb-15 bg-background2">
      <div className="mx-auto max-w-container space-y-12">
        {ladderPhases.map((phase, index) => (
          <StatePhase
            key={phase.phase}
            phase={phase.phase}
            state={stateSlug}
            /* Every phase after the first connects up to the one before it. */
            previousConnector={index > 0}
            /* …and every phase but the last connects down to the next one. */
            nextConnector={index < ladderPhases.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
