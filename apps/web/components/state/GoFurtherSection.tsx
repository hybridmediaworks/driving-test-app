"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";import { useEntitlement } from "@/lib/auth-context";
import { PROMOTED_TO_OWN_SECTION, splitLadderPhases } from "@/lib/stateHubSections";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

type Tool = { title: string; body: string; href: string };

export default function GoFurtherSection() {
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const isPremium = useEntitlement().isPremiumFor(selectedVehicle);
  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const query = `state=${stateCode}&vehicle_type=${vehicleType}`;
  const phases = useLadderPhases();

  // Same resolution ExamSimulatorSection uses for its own CTA: a premium learner goes straight into
  // the simulator quiz; everyone else lands on the /exam-simulator browse list.
  const simulatorSlug = phases
    .find((p) => p.header.headerTitle === "The exam simulator")
    ?.steps.find((s) => !s.placeholder && s.slug)?.slug;
  const canStartSimulator = isPremium && Boolean(simulatorSlug) && Boolean(selectedState);
  const examSimulatorHref = canStartSimulator
    ? `/${stateToSlug(selectedState)}/${simulatorSlug}/quiz`
    : "/exam-simulator";

  const stages = splitLadderPhases(phases, selectedVehicle)
    .ladder.filter((p) => !PROMOTED_TO_OWN_SECTION.includes(p.header.headerTitle))
    .filter((p) => p.steps.some((s) => !s.placeholder));
  const testCount = stages.flatMap((p) => p.steps).filter((s) => !s.placeholder).length;

  const groups: { label: string; tools: Tool[] }[] = [
    {
      label: "Before you start",
      tools: [
        {
          title: "How it works",
          body: stages.length > 0 ? `The whole route, in ${stages.length} stages` : "The whole route, step by step",
          href: "/how-it-works",
        },
        { title: "Pass guarantee", body: "Pass first time, or get a refund", href: "/pass-guarantee" },
      ],
    },
    {
      label: "While you study",
      tools: [
        { title: "Road sign flashcards", body: "Learn a sign in seconds", href: `/flashcards?${query}` },
        { title: "Cheat sheets", body: "The key numbers on one page", href: `/cheat-sheets?${query}` },
        {
          title: "More practice tests",
          body: testCount > 0 ? `All ${testCount} ${selectedState} tests` : `Every ${selectedState} test`,
          href: `/quizzes?${query}&test_track=${selectedTestType}`,
        },
      ],
    },
  ];

  let number = 0;

  return (
    <section className="bg-background px-5 py-15 lg:py-28">
      <div className="mx-auto max-w-container">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
              Helpful resources
            </p>
            <Heading as="h2" size="md" weight="bold" className="mt-3">
              The right tool for every step
            </Heading>
          </div>
          <Paragraph color="muted" className="md:pb-1.5">
            Six tools, one account. Pick one to see it in action.
          </Paragraph>
        </div>

        <div className="mt-10 grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <nav aria-label="Helpful resources" className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-3 font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-400">{group.label}</p>
                <ul className="mt-2 space-y-1">
                  {group.tools.map((tool) => {
                    number += 1;
                    return (
                      <li key={tool.title}>
                        <Link
                          href={tool.href}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white dark:hover:bg-neutral-800"
                        >
                          <span className="w-5 shrink-0 font-mono text-xs text-neutral-400">
                            {String(number).padStart(2, "0")}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-neutral-700 dark:text-neutral-200">
                              {tool.title}
                            </span>
                            <span className="block text-sm text-neutral-500 dark:text-neutral-400">{tool.body}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div>
              <p className="px-3 font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-400">Test week</p>
              <Link
                href={examSimulatorHref}
                className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3.5 shadow-xs dark:bg-neutral-800"
              >
                <span className="w-5 shrink-0 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">06</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-neutral-900 dark:text-neutral-100">The exam simulator</span>
                  <span className="block text-sm text-neutral-500 dark:text-neutral-400">A full dress rehearsal</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              </Link>
            </div>
          </nav>

          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-hover dark:bg-neutral-800">
            <div className="bg-[#0b1846] px-5 pt-5 pb-10 md:px-6 md:pb-12">
              <p className="font-mono text-xs text-white/60">06 / 06 · Test week</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/state-hub/exam-simulator-preview.png"
                alt="The exam simulator: a timed road sign question with a progress grid"
                className="mx-auto mt-6 w-full max-w-150 rounded-2xl"
              />
            </div>
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div>
                <p className="font-sora text-xl font-bold text-neutral-900 dark:text-neutral-100">The exam simulator</p>
                <p className="mt-1 max-w-115 text-sm text-neutral-500 dark:text-neutral-400">
                  A full-length timed run under the same conditions as the real exam. Take one the day before.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href="/how-it-works"
                  className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-4 text-sm font-bold text-neutral-900 transition-colors hover:border-blue-500 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  Next: How it works
                </Link>
                <Link
                  href={examSimulatorHref}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-yellow-400 px-4 text-sm font-bold text-neutral-900 transition-colors hover:bg-yellow-500"
                >
                  {canStartSimulator ? "Start the simulator" : "Open the simulator"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
