"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import TestSteps from "@/components/state/TestSteps";
import { useHasProgressSidebar } from "@/components/state/StateHubLayout";
import { phaseSummary } from "@/lib/phaseLadder";
import {
  ENDORSEMENTS_SECTION_ID,
  endorsementAnchorId,
  splitLadderPhases,
} from "@/lib/stateHubSections";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateToSlug } from "@/lib/usStates";

/**
 * The CDL endorsements that sit outside the numbered main program — HazMat, School Bus, Air Brakes
 * and the rest. They are deliberately NOT rungs in the ladder: they carry no phase number and no
 * connectors, because a driver picks the ones their job needs rather than working through them in
 * order. Renders nothing for car/motorcycle, whose ladders have no such split.
 */
export default function OptionalEndorsementsSection() {
  const phases = useLadderPhases();
  const { selectedState, selectedVehicle } = useWebLayout();
  const hasSidebar = useHasProgressSidebar();
  const stateSlug = selectedState ? stateToSlug(selectedState) : undefined;

  const { endorsements } = splitLadderPhases(phases, selectedVehicle);

  if (endorsements.length === 0) return null;

  return (
    <section
      id={ENDORSEMENTS_SECTION_ID}
      className="md:px-15 scroll-mt-6 bg-background px-5 pt-15 pb-15 lg:pt-20 lg:pb-20"
    >
      <div className="mx-auto max-w-container">
        <div className="min-w-0 space-y-4">
          <Heading as="h2">Optional endorsements</Heading>
          <Paragraph color="muted" className="max-w-3xl">
            Add the ones your job needs. Each is a separate {selectedState} endorsement exam — take
            them in any order, once your main program above is done.
          </Paragraph>
        </div>

        <div className="mt-12 min-w-0 space-y-12">
          {endorsements.map((phase) => {
            const summary = phaseSummary(phase);

            return (
              <div
                key={phase.phase}
                id={endorsementAnchorId(phase.phase)}
                className="scroll-mt-6 space-y-6"
              >
                {/* Indented by the same 116px TestSteps insets itself (see its
                    w-[calc(100%-116px)]), which in the numbered ladder is the column the phase
                    circle and its rail occupy. Without it the heading sat flush left while its own
                    cards started 116px in, leaving a dead notch above the first card. */}
                <div className="md:ps-29 max-w-3xl space-y-2">
                  {summary && (
                    <Paragraph color="primary" className="font-semibold">
                      {summary}
                    </Paragraph>
                  )}
                  <Heading as="h3" size="sm">
                    {phase.header.headerTitle}
                  </Heading>
                  {phase.header.headerDesc && (
                    <Paragraph color="muted" className="pt-1">
                      {phase.header.headerDesc}
                    </Paragraph>
                  )}
                </div>

                <TestSteps
                  steps={phase.steps}
                  state={stateSlug}
                  columns={hasSidebar ? 3 : 4}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
