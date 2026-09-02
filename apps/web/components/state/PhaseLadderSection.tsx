"use client";

import { Fragment } from "react";
import StatePhase from "@/components/state/StatePhase";
import HandbookPhase from "@/components/state/HandbookPhase";
import { usePhaseNumbers } from "@/lib/usePhaseCompletion";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateToSlug } from "@/lib/usStates";

/**
 * The dynamic replacement for the old hardcoded "phase 1 through 7" JSX — the real ladder length
 * varies per state/vehicle/test-track (a category with no quizzes for this combination produces
 * no phase at all), so this renders however many real phases exist instead of assuming a fixed
 * count. One promotional PremiumCTA is inserted after the first phase, matching the reference
 * layout's intent without needing to guess proportional placement across a variable-length list.
 */
export default function PhaseLadderSection() {
  const phaseNumbers = usePhaseNumbers();
  const { selectedState } = useWebLayout();
  const stateSlug = selectedState ? stateToSlug(selectedState) : undefined;

  if (phaseNumbers.length === 0) return null;

  return (
    <section className="md:px-15 px-5 pt-15 pb-15 lg:pt-30 lg:pb-15 bg-background2">
      <div className="mx-auto max-w-container space-y-12">
        {phaseNumbers.map((phase, index) => {
          // The one CTA always sits between phase index 0 and 1, so index 1 is the only phase
          // ever preceded by it.
          const showCtaAfter = index === 0 && phaseNumbers.length > 1;
          const precededByCta = index === 1;

          return (
            <Fragment key={phase}>
              <StatePhase
                phase={phase}
                state={stateSlug}
                previousConnector={index > 0 && !precededByCta}
                /* The handbook rung always follows the last phase, so every phase connects downward. */
                nextConnector
              />
              {showCtaAfter}
            </Fragment>
          );
        })}
        {/* Handbook is the final numbered rung, then the "end of theory prep" milestone. */}
        <HandbookPhase phaseNumber={phaseNumbers.length + 1} />
      </div>
    </section>
  );
}
