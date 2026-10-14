"use client";

import { CheckCircle2 } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout, WebLayoutProvider } from "@/lib/web-layout-context";

type ChecklistItem = {
  title: string;
  body: string;
};

const CHECKLIST: ChecklistItem[] = [
  {
    title: "Bring a valid photo ID",
    body: "A driver's license, state ID, or passport the DMV accepts as proof of who you are.",
  },
  {
    title: "Bring your Social Security number",
    body: "Either the card itself or a document that shows it, like a W-2 or pay stub — most states ask for one.",
  },
  {
    title: "Bring proof of residency",
    body: "A utility bill, lease, or bank statement with your current address and name on it.",
  },
  {
    title: "Bring the permit or license fee",
    body: "Fees vary by state — check your state's cheat sheet or DMV site for the exact amount, and bring a card or cash as accepted.",
  },
  {
    title: "Pass a vision screening",
    body: "Most DMVs test your eyesight on the spot. Bring glasses or contacts if you need them to read a standard eye chart.",
  },
  {
    title: "Bring parent or guardian consent, if you're under 18",
    body: "A parent or legal guardian usually needs to sign your application in person, or provide notarized consent — rules vary by state.",
  },
  {
    title: "Know the knowledge test is pass/fail on the spot",
    body: "Most states tell you your score immediately. If you don't pass, ask about the retake policy and any waiting period.",
  },
];

function BeforeYourExamInner() {
  const { selectedState } = useWebLayout();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="home" />
      <main className="flex-1">
        <section className="px-5 py-15 lg:py-24">
          <div className="mx-auto max-w-container">
            <div className="max-w-[706px] space-y-4">
              <Heading as="h1">10 things to do before your DMV exam</Heading>
              <Paragraph size="xl" color="muted">
                {selectedState
                  ? `What to bring and what to expect at the ${selectedState} DMV, so nothing holds up your test day.`
                  : "What to bring and what to expect on test day, so nothing holds up your exam."}
              </Paragraph>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-background3 dark:border-white/10 bg-white dark:bg-neutral-800 p-6"
                >
                  <CheckCircle2
                    aria-hidden
                    className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                  />
                  <div>
                    <h3 className="font-sora text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </h3>
                    <Paragraph size="sm" color="muted" className="mt-1">
                      {item.body}
                    </Paragraph>
                  </div>
                </div>
              ))}
            </div>

            <Paragraph size="sm" color="muted" className="mt-10">
              Exact requirements and fees vary by state — check your{" "}
              {selectedState ? `${selectedState} cheat sheet` : "state's cheat sheet"} or your
              local DMV site to confirm before you go.
            </Paragraph>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function BeforeYourExamPage() {
  return (
    <WebLayoutProvider>
      <BeforeYourExamInner />
    </WebLayoutProvider>
  );
}
