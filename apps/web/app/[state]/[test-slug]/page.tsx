import type { Metadata } from "next";
import WrittenTestContent from "@/components/state/WrittenTestContent";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import Header from "@/components/Header";
import EmailCaptureSection from "@/components/state/EmailCaptureSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/Footer";
import HeroSection from "@/components/state/test-slug/HeroSection";
import PreparingSection from "@/components/state/test-slug/PreparingSection";
import QuickFacts from "@/components/state/test-slug/QuickFacts";

function resolveStateName(stateSlug: string): string {
  const name = stateSlug ? slugToStateName(stateSlug) : "";
  return (usStates as string[]).includes(name) ? name : "Alaska";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const stateName = resolveStateName(state);

  const title = `Free Online DMV Written Test Practice for ${stateName} (2026)`;
  const description = `Practice the exact question formats your ${stateName} DMV written test uses. 30 questions, based on the official driver's manual, with instant explanations.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function WrittenTestPage({
  params,
}: {
  params: Promise<{ state: string; "test-slug": string }>;
}) {
  const { state, "test-slug": testSlug } = await params;

  return (
    <WebLayoutProvider stateSlug={state}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="states" hideNav />
        <HeroSection />
        <PreparingSection />
        <QuickFacts />

        <EmailCaptureSection />
        <CTASection href={`/${state}/dmv-written-test`} />
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
