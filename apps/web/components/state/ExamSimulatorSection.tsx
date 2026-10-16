"use client";

import Link from "next/link";
import { Gem, Play } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useEntitlement } from "@/lib/auth-context";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const CALLOUTS = [
  { title: "Exam mode", body: "Timed, just like test day." },
  { title: "Same number of questions", bodyKey: "official-exam" as const },
  { title: "Unlimited chances", body: "Retry until your confidence is bulletproof." },
  { title: "AI Tutor", body: "Instant explanations for every answer." },
];

export default function ExamSimulatorSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const { isPremiumFor } = useEntitlement();
  const isPremium = isPremiumFor(selectedVehicle);
  const phases = useLadderPhases();
  const stateCode = stateAbbreviations[selectedState] ?? "";

  // The simulator quiz used to be reachable only as ladder phase "The exam simulator"; the
  // redesign lifts that phase out of the ladder, so entitled learners get its real link here
  // instead of an upgrade prompt they've already paid for.
  const simulatorStep = phases
    .find((p) => p.header.headerTitle === "The exam simulator")
    ?.steps.find((s) => !s.placeholder && s.slug);
  const simulatorSlug = simulatorStep?.slug;

  const canStart =
    isPremium && Boolean(simulatorSlug) && Boolean(selectedState);
  // The quiz's own detail page (no /quiz suffix) is a preview with its own Start button -- "Start
  // the simulator" means the player itself, not a second click through a preview page.
  const ctaHref = canStart
    ? `/${stateToSlug(selectedState)}/${simulatorSlug}/quiz`
    : "/pricing";

  return (
    <section id="exam-simulator" className="scroll-mt-6 px-5 py-15 lg:py-28">
      <div className="mx-auto max-w-container">
        <div className="mx-auto max-w-225 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
            The exam simulator
          </p>
          <Heading size="md" weight="bold" className="mt-3">
            A test that feels like the real thing
          </Heading>
          <Paragraph color="muted" className="mt-3">
            Try a question below. Pick an answer.
          </Paragraph>
        </div>

        <div className="mt-10 grid gap-7 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_294px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/state-hub/exam-simulator.png"
            alt="Exam simulator: a road sign question with answer choices and a progress grid"
            className="w-full rounded-3xl shadow-hover"
          />

          <div className="flex flex-col gap-3">
            {CALLOUTS.map((callout, index) => (
              <div
                key={callout.title}
                className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 dark:bg-neutral-800"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{callout.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                    {callout.bodyKey === "official-exam"
                      ? `As the official ${selectedState || stateCode} exam.`
                      : callout.body}
                  </p>
                </div>
              </div>
            ))}
            <Link
              href={ctaHref}
              className="mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-500 lg:mt-auto"
            >
              {canStart ? (
                <Play aria-hidden className="size-4 fill-current" />
              ) : (
                <Gem aria-hidden className="size-4" />
              )}
              {canStart ? "Start the simulator" : "Unlock the full simulator"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
