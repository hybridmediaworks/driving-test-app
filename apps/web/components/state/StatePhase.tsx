"use client";

import { useEffect, useState } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import NewTestSteps from "@/components/cdl/NewTestSteps";
import HandBookSection from "@/components/state/HandBookSection";
import { useWebLayout } from "@/lib/web-layout-context";
import { fetchStateSteps, type StepsMockPhase } from "@/data/stepsMockData";

export default function StatePhase({
  phase,
  nextConnector = false,
  previousConnector = false,
}: {
  phase: number;
  nextConnector?: boolean;
  previousConnector?: boolean;
}) {
  const { selectedState } = useWebLayout();
  const [phaseData, setPhaseData] = useState<StepsMockPhase | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchStateSteps().then((phases) => {
      if (cancelled) return;
      setPhaseData(phases.find((p) => p.phase === phase) ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [phase, selectedState]);

  if (!phaseData) return null;

  return (
    <div className="space-y-10">
      <div className="flex gap-4 max-w-3xl">
        <div className="relative">
          {previousConnector && (
            <div className="md:w-15 w-8.5 ms-auto md:border-l-14 border-l-8 md:border-t-14 md:rounded-tl-[28px] border-white h-12 -mt-11.75" />
          )}
          <Heading
            as="h3"
            size="xs"
            className={`rounded-full flex items-center justify-center md:min-w-25 md:min-h-25 min-w-15 min-h-15 md:border-14 border-6 ${phaseData.phaseStatus === "active" ? "border-blue-100 bg-linear-to-r from-blue-600 to-blue-500 text-white" : "border-[#E7E6E1] bg-white"}`}
          >
            {phaseData.phase}
          </Heading>
          <div className="md:w-15 w-8.5 ms-auto md:border-l-14 border-l-8 md:border-b-14 border-b-8 rounded-bl-[28px] border-white h-full " />
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
        <NewTestSteps
          steps={phaseData.steps.map((step) => ({
            title: step.title,
            totalQuestions: step.totalQuestions,
            totalTime: step.totalTime,
            type: step.type,
            image: step.image,
            status: step.status,
            style: step.style,
            "quiz-valut": step["quiz-valut"],
          }))}
          columns={4}
          nextConnector={nextConnector}
        />
      )}
    </div>
  );
}
