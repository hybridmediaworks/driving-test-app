"use client";

import StatePhase from "@/components/state/StatePhase";
import { useHasProgressSidebar } from "@/components/state/StateHubLayout";
import { PROMOTED_TO_OWN_SECTION, splitLadderPhases } from "@/lib/stateHubSections";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateToSlug } from "@/lib/usStates";

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
  const { selectedState, selectedVehicle } = useWebLayout();
  const hasSidebar = useHasProgressSidebar();
  const stateSlug = selectedState ? stateToSlug(selectedState) : undefined;

  // CDL numbers only its main program; its optional endorsements render un-numbered in
  // OptionalEndorsementsSection instead. Car and motorcycle keep every phase here.
  const { ladder } = splitLadderPhases(phases, selectedVehicle);

  const ladderPhases = ladder.filter(
    (p) => !PROMOTED_TO_OWN_SECTION.includes(p.header.headerTitle),
  );

  // CDL numbers its main program from 1, even though that category is not the first one the API
  // returns (its optional endorsements render un-numbered further down instead).
  const isCdl = selectedVehicle === "CDL";

  if (ladderPhases.length === 0) return null;

  return (
    <section className="md:px-15 px-5 pt-15 pb-15 lg:pt-30 lg:pb-15 bg-background2">
      <div className="mx-auto max-w-container">
        <div className="min-w-0 space-y-12">
          {ladderPhases.map((phase, index) => (
            <StatePhase
              key={phase.phase}
              phase={phase.phase}
              displayNumber={isCdl ? index + 1 : undefined}
              state={stateSlug}
              /* The rail takes 320px out of the row, so four cards across would leave them too
                 narrow to read at laptop widths — three keeps them the size they are without it. */
              columns={hasSidebar ? 3 : 4}
              /* Every phase after the first connects up to the one before it. */
              previousConnector={index > 0}
              /* …and every phase but the last connects down to the next one. */
              nextConnector={index < ladderPhases.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
