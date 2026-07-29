"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import TestSteps from "@/components/cdl/TestSteps";
import HandBookSection from "@/components/state/HandBookSection";
import { usePhaseCompletion } from "@/lib/usePhaseCompletion";

export default function StatePhase({
  phase,
  nextConnector = false,
  previousConnector = false,
}: {
  phase: number;
  nextConnector?: boolean;
  previousConnector?: boolean;
}) {
  const { phase: phaseData } = usePhaseCompletion(phase);
  const {
    isJustFinished: previousPhaseJustFinished,
    isFullyCompleted: previousPhaseFullyCompleted,
  } = usePhaseCompletion(phase - 1);

  if (!phaseData) return null;

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
    <div className="space-y-10">
      <div className="flex gap-4 max-w-3xl">
        <div className="relative">
          {previousConnector && (
            <div
              className={`md:w-15 w-8.5 ms-auto md:border-l-14 border-l-8 md:border-t-14 md:rounded-tl-[28px] h-12 -mt-11.75 ${
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
            className={`md:w-15 w-8.5 ms-auto md:border-l-14 border-l-8 md:border-b-14 border-b-8 rounded-bl-[28px] h-full ${
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

        <div className="space-y-2">
          <Paragraph color="primary" className="font-semibold">
            {phaseData.header.totalQuestions} questions · ~
            {phaseData.header.totalTime} min
          </Paragraph>
          <Heading as="h2">{phaseData.header.headerTitle}</Heading>
          <Paragraph color="muted" className="pt-1">
            {phaseData.header.headerDesc}
          </Paragraph>
        </div>
      </div>
      {phaseData.header.handbook ? (
        <HandBookSection />
      ) : (
        <TestSteps
          steps={phaseData.steps.map((step) => ({
            title: step.title,
            totalQuestions: step.totalQuestions,
            totalTime: step.totalTime,
            type: step.type,
            image: step.image,
            status: step.status,
            style: step.style,
            "quiz-valut": step["quiz-valut"],
            completed: step.completed,
            justCompleted: step.justCompleted,
          }))}
          columns={4}
          nextConnector={nextConnector}
          phaseActive={isActive}
          phaseJustActivated={animateCircleIn}
        />
      )}
    </div>
  );
}
