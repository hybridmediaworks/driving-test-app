import type { Metadata } from "next";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import Header from "@/components/Header";
import HeroSection from "@/components/state/HeroSection";
import LiveDataSection from "@/components/state/LiveDataSection";
import PremiumCTA from "@/components/state/PremiumCTA";
import ReviewAccuracy from "@/components/state/ReviewAccuracy";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import EmailCaptureSection from "@/components/state/EmailCaptureSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/Footer";
import StatePhase from "@/components/state/StatePhase";

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
          <section className="md:px-15 px-5 pt-15 pb-15 lg:pt-30 lg:pb-15 bg-background2">
            <div className="mx-auto max-w-container space-y-12">
              <StatePhase phase={1} nextConnector />
              <StatePhase phase={2} previousConnector nextConnector />
              <PremiumCTA previousConnector nextConnector />
              <StatePhase phase={3} nextConnector />
              <StatePhase phase={4} previousConnector nextConnector />
              <StatePhase phase={5} previousConnector nextConnector />
              <PremiumCTA previousConnector nextConnector />
              <StatePhase phase={6} nextConnector />
              <StatePhase phase={7} previousConnector />
            </div>
          </section>
          <ReviewAccuracy />
          <GoFurtherSection />
          <EmailCaptureSection />
          <CTASection href={`/${state}/dmv-written-test`} />
          <Footer />
        </main>
      </div>
    </WebLayoutProvider>
  );
}
