"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { usePhaseCompletion, type PhaseCompletionState } from "@/lib/usePhaseCompletion";
import { Gem } from "lucide-react";

export default function PremiumCTA({
  previousConnector = false,
  nextConnector = false,
  afterPhase,
  usePhaseData = usePhaseCompletion,
}: {
  previousConnector?: boolean;
  nextConnector?: boolean;
  /** The phase whose completion state drives this CTA's own connectors — it sits right after that phase in the page. */
  afterPhase?: number;
  /** Override for testing/composition — usePhaseCompletion itself already reads the current vehicle/test-track from WebLayoutProvider, so callers don't normally need to pass this. */
  usePhaseData?: (phase: number) => PhaseCompletionState;
}) {
  const { selectedState, selectedTestType } = useWebLayout();
  const { isJustFinished, isFullyCompleted } = usePhaseData(
    afterPhase ?? -1,
  );
  const isDrivingTest = selectedTestType === "driving_test";

  return (
    <section className="pt-0 md:pt-12 relative mb-0">
      {previousConnector && (
        <div
          className={`md:left-10 left-6.5 z-0 md:w-30 w-16 md:border-14 border-8 md:border-r-0 border-r-0 absolute md:rounded-tl-[28px] border-t-0 h-28 -top-12 ${
            isFullyCompleted
              ? "border-blue-500"
              : isJustFinished
                ? "connector-fill border-white"
                : "border-white"
          }`}
          style={
            isJustFinished
              ? ({ "--fill-index": 2 } as React.CSSProperties)
              : undefined
          }
        />
      )}
      <div
        className="relative z-10 mx-auto max-w-container xl:ps-24 bg-cover bg-blue-1000 border border-blue-200 rounded-xl  flex flex-col xl:flex-row justify-between items-center xl:gap-4 gap-6"
        style={{ backgroundImage: "url('/state-premium-cta.png')" }}
      >
        <div className="space-y-4 xl:max-w-161 xl:py-14 py-5 px-5 xl:px-0 h-full">
          <Heading as="h2" color="white">
            {selectedState} students who use Premium pass
            <span className="text-blue-500"> 97% of the time</span>
          </Heading>
          <Paragraph className="mb-6 text-neutral-300!">
            {isDrivingTest ? (
              <>
                Behind-the-wheel maneuvers, hazard awareness, road skills — the core of the {selectedState} driving
                test. Master these first.
              </>
            ) : (
              <>
                Right-of-way, signals, speed limits, lane rules — the core of the {selectedState} written exam.
                Master these first.
              </>
            )}
          </Paragraph>
          <Button
            className="w-full md:w-fit bg-yellow-500! border-yellow-500!"
            variant="outline"
            href="/pricing"
          >
            <Gem /> Upgrade to Premium
          </Button>
        </div>
        <div>
          <img
            src="/state-premium-girl.png"
            alt=""
            className="lg:-mt-25 -mt-12"
          />
        </div>
      </div>
      {nextConnector && (
        <div
          className={`w-15 md:ms-10 ms-6.5 md:border-l-14 border-l-8 md:h-22 h-12 ${
            isFullyCompleted
              ? "border-blue-500"
              : isJustFinished
                ? "connector-fill border-white"
                : "border-white"
          }`}
          style={
            isJustFinished
              ? ({ "--fill-index": 3 } as React.CSSProperties)
              : undefined
          }
        />
      )}
    </section>
  );
}
