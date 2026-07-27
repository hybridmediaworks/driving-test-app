import type { Metadata } from "next";
import StateLandingPage from "@/components/state/StateLandingPage";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import Header from "@/components/Header";
import HeroSection from "@/components/state/HeroSection";
import LiveDataSection from "@/components/state/LiveDataSection";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import TestSteps from "@/components/cdl/TestSteps";
import { fetchStateSteps } from "@/data/stepsMockData";

function resolveStateName(stateSlug: string): string {
  const name = stateSlug ? slugToStateName(stateSlug) : "";
  return (usStates as string[]).includes(name) ? name : "Oregon";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const stateName = resolveStateName(state);

  const title = `${stateName} DMV Permit Test - Requirements, Study Guide & Practice`;
  const description = `Practice with real exam-like questions that mirror your ${stateName} DMV permit test - same format, same difficulty, same tricky answer choices.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function StateDynamicPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const phases = await fetchStateSteps();

  return (
    <WebLayoutProvider stateSlug={state}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="states" />
        <main className="flex-1">
          <HeroSection />
          <LiveDataSection />
          {phases.map((phase) => (
            <section
              key={phase.phase}
              className="px-5 pt-0 pb-10 lg:pt-30 lg:pb-15 bg-[#F2F1EC]"
            >
              <div className="mx-auto max-w-container space-y-12">
                <div className="flex items-start gap-4 max-w-2xl">
                  <Heading
                    as="h3"
                    size="xs"
                    className={`rounded-full flex items-center justify-center min-w-25 min-h-25 border-14 ${phase.phaseStatus === "active" ? "border-blue-100 bg-linear-to-r from-blue-600 to-blue-500 text-white" : "border-[#E7E6E1] bg-white"}`}
                  >
                    {phase.phase}
                  </Heading>
                  <div className="space-y-2">
                    <Paragraph color="primary" className="font-semibold">
                      {phase.header.totalQuestions} questions · ~
                      {phase.header.totalTime} min
                    </Paragraph>
                    <Heading as="h2">{phase.header.headerTitle}</Heading>
                    <Paragraph color="muted" className="pt-1">
                      {phase.header.headerDesc}
                    </Paragraph>
                  </div>
                </div>
                <TestSteps
                  steps={phase.steps.map((step) => ({
                    title: step.title,
                    totalQuestions: Number(step.totalQuestions),
                    totalTime: Number(step.totalTime),
                    type: step.type,
                    image: step.image,
                    status: step.status,
                  }))}
                  columns={4}
                />
              </div>
            </section>
          ))}
        </main>
      </div>
      <StateLandingPage state={state} />
    </WebLayoutProvider>
  );
}
