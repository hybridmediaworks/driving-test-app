import type { Metadata } from "next";
import StateLandingPage from "@/components/state/StateLandingPage";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";

function resolveStateName(stateSlug: string): string {
  const name = stateSlug ? slugToStateName(stateSlug) : "";
  return (usStates as string[]).includes(name) ? name : "Oregon";
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const stateName = resolveStateName(state);

  const title = `${stateName} DMV Permit Test - Requirements, Study Guide & Practice`;
  const description = `Practice with real exam-like questions that mirror your ${stateName} DMV permit test - same format, same difficulty, same tricky answer choices.`;

  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function StateDynamicPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;

  return (
    <WebLayoutProvider stateSlug={state}>
      <StateLandingPage state={state} />
    </WebLayoutProvider>
  );
}
