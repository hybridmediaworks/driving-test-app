import type { Metadata } from "next";
import WrittenTestContent from "@/components/state/WrittenTestContent";
import { slugToStateName, usStates } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";

function resolveStateName(stateSlug: string): string {
  const name = stateSlug ? slugToStateName(stateSlug) : "";
  return (usStates as string[]).includes(name) ? name : "Alaska";
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const stateName = resolveStateName(state);

  const title = `Free Online DMV Written Test Practice for ${stateName} (2026)`;
  const description = `Practice the exact question formats your ${stateName} DMV written test uses. 30 questions, based on the official driver's manual, with instant explanations.`;

  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function WrittenTestPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;

  return (
    <WebLayoutProvider stateSlug={state}>
      <WrittenTestContent state={state} />
    </WebLayoutProvider>
  );
}
