import type { Metadata } from "next";
import StateLandingPage from "@/components/state/StateLandingPage";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import Header from "@/components/Header";
import HeroSection from "@/components/state/HeroSection";
import LiveDataSection from "@/components/state/LiveDataSection";

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

  return (
    <WebLayoutProvider stateSlug={state}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="states" />
        <main className="flex-1">
          <HeroSection />
          <LiveDataSection />
        </main>
      </div>
      <StateLandingPage state={state} />
    </WebLayoutProvider>
  );
}
