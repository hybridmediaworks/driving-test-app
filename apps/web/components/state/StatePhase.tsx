"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import TestSteps from "@/components/state/TestSteps";
import { phaseAnchorId } from "@/lib/stateHubSections";
import { isMarathonStep } from "@/lib/phaseLadder";
import {
  usePhaseCompletion,
  type PhaseCompletionState,
} from "@/lib/usePhaseCompletion";

export default function StatePhase({
  phase,
  nextConnector = false,
  previousConnector = false,
  usePhaseData = usePhaseCompletion,
  state,
  columns = 4,
}: {
  phase: number;
  nextConnector?: boolean;
  previousConnector?: boolean;
  /** Override for testing/composition — usePhaseCompletion itself already reads the current vehicle/test-track from WebLayoutProvider, so callers don't normally need to pass this. */
  usePhaseData?: (phase: number) => PhaseCompletionState;
  /** State slug (e.g. "alabama") — forwarded to each step so its card links to the real per-test page. */
  state?: string;
  /** Desktop step-grid columns. Drops to 3 when the progress sidebar takes a slice of the row. */
  columns?: number;
}) {
  const { phase: phaseData } = usePhaseData(phase);
  const {
    isJustFinished: previousPhaseJustFinished,
    isFullyCompleted: previousPhaseFullyCompleted,
  } = usePhaseData(phase - 1);

  if (!phaseData) return null;

  const hasSteps = phaseData.steps.length > 0;
  const isPlaceholder = hasSteps && phaseData.steps.every((s) => s.placeholder);

  // The header's own totalQuestions sums every quiz in the phase, marathon included — which
  // double-counts, since a marathon is a re-run of the same material as the short tests it
  // follows. Count those tests, then name the marathon alongside rather than adding it in.
  const realSteps = phaseData.steps.filter((s) => !s.placeholder);
  const marathons = realSteps.filter(isMarathonStep);
  const practiceQuestions = realSteps
    .filter((s) => !isMarathonStep(s))
    .reduce((sum, s) => sum + Number(s.totalQuestions ?? 0), 0);
  const summary = isPlaceholder
    ? "Coming soon"
    : [
        practiceQuestions > 0 ? `${practiceQuestions} questions` : null,
        marathons.length > 0
          ? `+ ${marathons.length > 1 ? `${marathons.length} Marathons` : "Marathon"}`
          : null,
      ]
        .filter(Boolean)
        .join(" ");

  // A phase is "active" either because the backend says so, or because the
  // phase before it is already fully done (no live trigger — just render the
  // filled state). animateCircleIn is the one live, one-time case: the
  // previous phase's last step just completed, so this phase becomes active
  // right now and should animate in rather than render pre-filled.
  const isActive =
    phaseData.phaseStatus === "active" || previousPhaseFullyCompleted;
  const animateCircleIn = previousPhaseJustFinished && !isActive;
  const showActiveStyle = isActive || animateCircleIn;

  return (
    <div id={phaseAnchorId(phaseData.phase)} className="scroll-mt-6 space-y-10">
      <div className="flex gap-4">
        <div className="relative">
          {previousConnector && (
            <div
              className={`md:w-18 w-8.5 ms-auto md:-me-4.5 md:border-l-14 border-l-8 md:border-t-14 md:rounded-tl-[28px] h-12 -mt-11.75 ${
                previousPhaseFullyCompleted
                  ? "border-blue-500"
                  : animateCircleIn
                    ? "connector-fill border-white"
                    : "border-white"
              }`}
              style={
                animateCircleIn
                  ? ({ "--fill-index": 2 } as React.CSSProperties)
                  : undefined
              }
            />
          )}
          <Heading
            as="h3"
            size="xs"
            className={`relative overflow-hidden rounded-full flex items-center justify-center md:min-w-25 md:min-h-25 min-w-15 min-h-15 md:border-14 border-6 ${showActiveStyle ? "border-blue-100 text-white" : "border-background3 bg-white"}`}
          >
            {isActive && !animateCircleIn && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-linear-to-r from-blue-600 to-blue-500"
              />
            )}
            {animateCircleIn && (
              <span
                aria-hidden
                className="circle-fill-in absolute inset-0 rounded-full bg-linear-to-r from-blue-600 to-blue-500"
                style={{ "--fill-index": 3 } as React.CSSProperties}
              />
            )}
            <span className="relative">{phaseData.phase}</span>
          </Heading>
          <div
            className={`md:w-18 w-8.5 ms-auto md:-me-4.5 md:border-l-14 border-l-8 md:border-b-14 border-b-8 rounded-bl-[28px] h-[calc(100%+14px)] ${
              isActive && !animateCircleIn
                ? "border-blue-500"
                : animateCircleIn
                  ? "connector-fill border-white"
                  : "border-white"
            }`}
            style={
              animateCircleIn
                ? ({ "--fill-index": 4 } as React.CSSProperties)
                : undefined
            }
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-6">
            <Heading as="h2" className="max-w-3xl">
              {phaseData.header.headerTitle}
            </Heading>
            {summary && (
              <span className="hidden shrink-0 text-sm text-neutral-500 sm:block">
                {summary}
              </span>
            )}
          </div>
          {phaseData.header.headerDesc && (
            <Paragraph color="muted" className="max-w-3xl pt-1">
              {phaseData.header.headerDesc}
            </Paragraph>
          )}
        </div>
      </div>
      {hasSteps && (
        <TestSteps
          steps={phaseData.steps.map((step) => ({
            title: step.title,
            slug: step.slug,
            totalQuestions: step.totalQuestions,
            totalTime: step.totalTime,
            type: step.type,
            locked: step.locked,
            lockMode: step.lockMode,
            outcome: step.outcome,
            image: step.image,
            status: step.status,
            style: step.style,
            completed: step.completed,
            justCompleted: step.justCompleted,
            placeholder: step.placeholder,
          }))}
          state={state}
          columns={columns}
          nextConnector={nextConnector}
          phaseActive={isActive}
          phaseJustActivated={animateCircleIn}
        />
      )}
    </div>
  );
}
