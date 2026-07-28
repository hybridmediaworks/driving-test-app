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
            <div className="w-15 ms-auto border-l-14 border-t-14 rounded-tl-[28px] border-white h-12 -mt-11.75" />
          )}
          <Heading
            as="h3"
            size="xs"
            className={`rounded-full flex items-center justify-center min-w-25 min-h-25 border-14 ${phaseData.phaseStatus === "active" ? "border-blue-100 bg-linear-to-r from-blue-600 to-blue-500 text-white" : "border-[#E7E6E1] bg-white"}`}
          >
            {phaseData.phase}
          </Heading>
          <div className="w-15 ms-auto border-l-14 border-b-14 rounded-bl-[28px] border-white h-full " />
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
          }))}
          columns={4}
          nextConnector={nextConnector}
        />
      )}
    </div>
  );
}
