"use client";

import Link from "next/link";
import { Gem } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useEntitlement } from "@/lib/auth-context";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

/**
 * "The exam simulator" — the tablet mockup of a real exam run behind a frosted "Unlock Premium
 * Now" overlay, ringed by four callout chips (Figma node 4147:8254). The chips are absolutely
 * placed around the device on xl (their Figma offsets, as percentages of the 1361×688 frame) and
 * fall back to a plain grid underneath on narrower screens.
 */

const CALLOUTS = [
  {
    title: "Exam Mode",
    body: "just like test day",
    // left 102.66 / top 33.44 of the 1361×688 Figma frame
    position: "xl:left-[7.5%] xl:top-[4.9%]",
    width: "xl:w-auto",
  },
  {
    title: "Same number of questions",
    bodyKey: "official-exam" as const,
    position: "xl:left-[82.8%] xl:top-[25.7%]",
    width: "xl:w-[226px]",
  },
  {
    title: "Unlimited chances",
    body: "Retry until your confidence is bulletproof",
    position: "xl:left-[0.3%] xl:top-[50.6%]",
    width: "xl:w-[236px]",
  },
  {
    title: "AI Tutor",
    body: "Instant explanations for every answer",
    position: "xl:left-[81.4%] xl:top-[73.9%]",
    width: "xl:w-[189px]",
  },
];

export default function ExamSimulatorSection() {
  const { selectedState } = useWebLayout();
  const { isPremium } = useEntitlement();
  const phases = useLadderPhases();
  const stateCode = stateAbbreviations[selectedState] ?? "";

  // The simulator quiz used to be reachable only as ladder phase "The exam simulator"; the
  // redesign lifts that phase out of the ladder, so entitled learners get its real link here
  // instead of an upgrade prompt they've already paid for.
  const simulatorSlug = phases
    .find((p) => p.header.headerTitle === "The exam simulator")
    ?.steps.find((s) => !s.placeholder && s.slug)?.slug;

  const canStart = isPremium && Boolean(simulatorSlug) && Boolean(selectedState);
  const ctaHref = canStart
    ? `/${stateToSlug(selectedState)}/${simulatorSlug}`
    : "/pricing";

  return (
    <section className="px-5 py-15 lg:py-30">
      <div className="mx-auto max-w-container">
        <div className="mx-auto flex max-w-[556px] flex-col items-center gap-4 text-center">
          <Heading as="h2" className="text-center">
            The exam simulator
          </Heading>
          <Paragraph size="xl" className="text-center">
            Take a test that feels like the real thing.
          </Paragraph>
        </div>

        <div className="relative mt-10 lg:mt-15">
          {/* Device — the exam screen behind a frosted upsell overlay */}
          <div className="relative mx-auto aspect-[918/688] w-full max-w-[918px] overflow-hidden rounded-3xl border border-blue-100 bg-blue-50 lg:rounded-[48px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/state-hub/exam-screen.png"
              alt=""
              aria-hidden
              /* Figma's 758×568 screen leaf centred in the 918×688 device: inset (918-758)/2/918. */
              className="absolute inset-[8.71%] size-[82.58%] rounded-[24px] object-cover object-top blur-[3px]"
            />
            <div aria-hidden className="absolute inset-0 bg-white/55" />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center lg:gap-8">
              <Gem
                aria-hidden
                strokeWidth={1.25}
                className="size-14 text-yellow-500 sm:size-20 lg:size-30"
              />
              <div className="flex w-full max-w-[518px] flex-col items-center gap-4 lg:gap-6">
                <div className="flex flex-col items-center gap-3 lg:gap-4">
                  <p className="font-sora text-[26px] leading-tight font-semibold tracking-[-0.96px] text-black sm:text-[36px] lg:text-[48px] lg:leading-14">
                    {canStart ? "Your exam simulator" : "Unlock Premium Now"}
                  </p>
                  <Paragraph className="max-w-[344px] text-center">
                    {canStart
                      ? `A full-length ${stateCode || selectedState} run, timed and scored exactly like the real exam.`
                      : "Unlock unlimited questions, ad-free studying, and a money-back guarantee."}
                  </Paragraph>
                </div>
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-500 px-5 py-3 text-base font-semibold text-neutral-700 shadow-xs transition-opacity hover:opacity-95"
                >
                  <Gem aria-hidden className="size-5" />
                  {canStart ? "Start the simulator" : "Upgrade to Premium"}
                </Link>
              </div>
            </div>
          </div>

          {/* Callout chips */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:mt-0 xl:block">
            {CALLOUTS.map((callout) => (
              <div
                key={callout.title}
                className={`rounded-xl border-2 border-blue-300 bg-white p-4 shadow-hover xl:absolute xl:p-4 ${callout.position} ${callout.width}`}
              >
                <p className="text-xl leading-[30px] font-semibold text-blue-500">
                  {callout.title}
                </p>
                <p className="text-base leading-6 text-neutral-700">
                  {callout.bodyKey === "official-exam"
                    ? `as the official ${stateCode || selectedState} exam`
                    : callout.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
