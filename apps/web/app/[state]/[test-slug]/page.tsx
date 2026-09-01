import type { Metadata } from "next";
import { slugToStateName, stateAbbreviations, usStates } from "@/lib/usStates";
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

type MetadataQuiz = { title: string; total_questions: number; test_track: "permit_test" | "driving_test" };

/** Server-side only, no auth needed — real per-quiz title/description for SEO. Falls back to the
 * generic copy below if the slug doesn't resolve (e.g. a bad/old link) rather than failing the page. */
async function resolveQuizForMetadata(stateCode: string, testSlug: string): Promise<MetadataQuiz | null> {
  if (!stateCode) return null;

  try {
    // Server-side code runs inside the same container as Laravel, so it always talks to it
    // directly on localhost — NEXT_PUBLIC_API_URL is a relative path ("/api/v1") meant for the
    // browser to hit through nginx, and is invalid as a URL for Node's server-side fetch.
    const apiUrl = "http://127.0.0.1:8001/api/v1";
    const res = await fetch(`${apiUrl}/quizzes?state=${stateCode}&slug=${testSlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; "test-slug": string }>;
}): Promise<Metadata> {
  const { state, "test-slug": testSlug } = await params;
  const stateName = resolveStateName(state);
  const stateCode = stateAbbreviations[stateName];
  const quiz = await resolveQuizForMetadata(stateCode, testSlug);

  const title = quiz
    ? `${quiz.title} — Free ${stateName} DMV ${quiz.test_track === "driving_test" ? "Driving" : "Written"} Test Practice (2026)`
    : `Free Online DMV Written Test Practice for ${stateName} (2026)`;
  const description = quiz
    ? `Practice ${quiz.title} for ${stateName} — ${quiz.total_questions} real questions based on the official driver's manual, with instant explanations.`
    : `Practice the exact question formats your ${stateName} DMV written test uses. 30 questions, based on the official driver's manual, with instant explanations.`;

  return { title, description, openGraph: { title, description, type: "website" } };
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
        <HeroSection testSlug={testSlug} />
        <PreparingSection testSlug={testSlug} />
        <QuickFacts testSlug={testSlug} />

        <EmailCaptureSection />
        <CTASection />
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
