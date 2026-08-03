import type { Metadata } from "next";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import Header from "@/components/Header";
import EmailCaptureSection from "@/components/state/EmailCaptureSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/Footer";
import MotorcycleTestTypeContent from "@/components/state/motorcycle/MotorcycleTestTypeContent";

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

  const title = `${stateName} Motorcycle Permit Test - Requirements, Study Guide & Practice`;
  const description = `Practice with real exam-like questions that mirror your ${stateName} DMV motorcycle permit test - same format, same difficulty, same tricky answer choices.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function MotorcyclePage({
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
          <MotorcycleTestTypeContent />
          <EmailCaptureSection />
          <CTASection href={`/${state}/dmv-written-test`} />
          <Footer />
        </main>
      </div>
    </WebLayoutProvider>
  );
}
