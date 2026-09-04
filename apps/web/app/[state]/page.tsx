import type { Metadata } from "next";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import Header from "@/components/Header";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/Footer";
import StateTestTypeContent from "@/components/state/StateTestTypeContent";
import StateHubLayout from "@/components/state/StateHubLayout";

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
    <WebLayoutProvider stateSlug={state} vehicleSlug="car">
      <div className="flex min-h-screen flex-col bg-background">
        {/* Signed-in learners get the progress rail down the right of the whole page, with the
            header inside the same column so the rail starts level with it. The CTA and footer stay
            outside, full-width, so the CTA's split background still runs edge to edge into the
            footer. */}
        <StateHubLayout header={<Header variant="states" />}>
          <main className="flex-1">
            <StateTestTypeContent />
          </main>
        </StateHubLayout>

        <CTASection />
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
