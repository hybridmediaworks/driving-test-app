"use client";

import { ArrowRight, Check, Columns4, Globe, SquareDot } from "lucide-react";
import { type CSSProperties, useState } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import StateSelectModal from "@/components/home/StateSelectModal";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

/* Voice Learning card — a live-looking audio equalizer. Each bar pulses
   (CSS keyframe on height, staggered timing) with a green→amber→red gradient
   anchored to the bottom so taller peaks glow hotter. Replaces the static PNG. */
const VL_BARS = [
  34, 52, 70, 86, 60, 40, 30, 48, 64, 82, 92, 64, 44, 32, 54,
  72, 88, 62, 42, 30, 50, 66, 80, 90, 60, 40, 30, 52, 68, 46,
];

function VoiceWaveform() {
  return (
    <div className="relative flex h-full w-full items-end justify-between overflow-hidden bg-[#0a0a0a] px-4 pt-5 pb-6">
      <style>{`@keyframes vlEq{0%,100%{height:16%}50%{height:var(--h)}}`}</style>
      {VL_BARS.map((h, i) => (
        <span
          key={`vl-${i}`}
          className="w-[7px] shrink-0 rounded-[3px]"
          style={
            {
              height: "16%",
              "--h": `${h}%`,
              background:
                "linear-gradient(to top,#16a34a,#4ade80 30%,#facc15 62%,#fb923c 82%,#ef4444)",
              backgroundSize: "100% 104px",
              backgroundPosition: "bottom",
              backgroundRepeat: "no-repeat",
              animation: `vlEq ${(0.85 + (i % 5) * 0.13).toFixed(2)}s ease-in-out -${(i * 0.17).toFixed(2)}s infinite`,
            } as CSSProperties
          }
        />
      ))}
      {/* soft floor sheen */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-linear-to-t from-white/10 to-transparent" />
    </div>
  );
}

function RowLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="text-xs font-bold tracking-[1.44px] text-neutral-500">
        {index}
      </span>
      <span className="min-w-fit text-xs font-semibold uppercase tracking-[1.92px] text-neutral-500">
        {label}
      </span>
      <div className="h-px w-full bg-background3" />
    </div>
  );
}

export default function ToolkitSection() {
  const { selectedState, hasStoredState } = useWebLayout();
  const [showStateModal, setShowStateModal] = useState(false);

  const stateHref = hasStoredState
    ? `/${stateToSlug(selectedState)}`
    : undefined;

  function onStartClick() {
    if (!hasStoredState) {
      setShowStateModal(true);
    }
  }

  return (
    <section className="px-5 pt-0 pb-10 lg:pt-30 lg:pb-15">
      <div className="mx-auto max-w-container space-y-5.5">
        {/* Header */}
        <div className="mx-auto flex max-w-170 flex-col items-start gap-4">
          <Paragraph
            className="w-fit border-b border-blue-100 px-3.5 pt-1.25 pb-1.5 font-bold tracking-[1.2px] text-blue-700 uppercase"
            size="xs"
          >
            ✦&nbsp;&nbsp;The toolkit
          </Paragraph>
          <Heading as="h2">
            Everything that
            <br />
            helps you ace it.
          </Heading>
        </div>

        {/* ROW 01 — AI Tutor */}
        <div className="pt-5 md:pt-9.5">
          <RowLabel index="01" label="AI Tutor" />
        </div>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div className="w-full space-y-4">
            <Heading as="h3">
              A tutor that knows
              <br />
              where you slip.
            </Heading>
            <Paragraph className="max-w-105">
              Every wrong answer teaches the model something. It rebuilds your
              plan in real time, so practice always targets your weakest signs,
              rules, and reflexes.
            </Paragraph>
            <ul className="space-y-2.75 pt-1.5">
              {[
                "Explained answers, not just right/wrong",
                "Adaptive weak-spot drills after every session",
                "Ask follow-ups in plain language, any time",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="h-5 w-5 shrink-0 rounded-[6px] bg-[#eef2ff] p-0.5 text-[#2b59ff]" />
                  <Paragraph>{item}</Paragraph>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              className="mt-2.5 gap-1.5 p-0! text-[15px] font-semibold text-[#2b59ff]"
              href={stateHref}
              onClick={onStartClick}
            >
              Meet the AI Tutor <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ai-tutor.png"
            alt="AI Tutor interface"
            className="w-full rounded-[26px] border border-background3 shadow-[0px_1px_1px_rgba(14,17,22,0.06),0px_2px_3px_rgba(14,17,22,0.05)] lg:w-auto"
          />
        </div>

        {/* ROW 02 — Practice & Insight */}
        <div className="pt-5 md:pt-17">
          <RowLabel index="02" label="Practice & Insight" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Progress Tracking */}
          <div className="overflow-hidden rounded-[18px] border border-background3 bg-white transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover">
            <div className="flex h-[150px] items-center justify-center border-b border-background3 bg-background">
              <div className="relative mx-auto h-[112px] w-[204px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/toolkit/readiness-ring.svg"
                  alt=""
                  className="absolute top-0 left-1/2 w-[204px] -translate-x-1/2"
                />
                <div className="absolute inset-x-0 top-[44px] flex flex-col items-center">
                  <span className="text-[13px] leading-5 text-neutral-600">
                    Readiness Score
                  </span>
                  <span className="font-sora text-[30px] leading-tight font-semibold text-neutral-900">
                    88%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 p-5">
              <Heading as="h4" size="xs">
                Progress Tracking
              </Heading>
              <Paragraph>
                A readiness score that tells you precisely when to book the
                test.
              </Paragraph>
            </div>
          </div>
          {/* Voice Learning */}
          <div className="overflow-hidden rounded-[18px] border border-background3 bg-white transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover">
            <div className="h-[150px] border-b border-background3">
              <VoiceWaveform />
            </div>
            <div className="space-y-1.5 p-5">
              <Heading as="h4" size="xs">
                Voice Learning
              </Heading>
              <Paragraph>
                Listen, answer aloud, and learn while you walk, cook, or
                commute.
              </Paragraph>
            </div>
          </div>
          {/* Flashcards */}
          <div className="overflow-hidden rounded-[18px] border border-background3 bg-white transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover">
            <div className="h-[150px] border-b border-background3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/flashcards.png"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1.5 p-5">
              <Heading as="h4" size="xs">
                Flashcards
              </Heading>
              <Paragraph>
                Spaced repetition that locks signs and rules into long-term
                memory.
              </Paragraph>
            </div>
          </div>
        </div>

        {/* ROW 03 — Exam Mode */}
        <div className="pt-5 md:pt-17">
          <RowLabel index="03" label="Exam Mode" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.20fr)_minmax(0,0.80fr)]">
          {/* Mock Exams */}
          <div className="rounded-[18px] border border-background3 bg-white p-[25px] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover">
            <div className="mb-3.5 flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
              <SquareDot className="h-[18px] w-[18px]" />
            </div>
            <Heading as="h4" size="sm">
              Mock Exams
            </Heading>
            <Paragraph className="mt-1.5">
              The real DMV format — timed, scored, and unforgiving in the best
              way.
            </Paragraph>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mockexams.svg" alt="" className="mt-4.5 w-full" />
          </div>
          {/* CDL + Motorcycle */}
          <div className="grid grid-cols-1 gap-4 lg:grid-rows-2">
            <div className="rounded-[18px] border border-background3 bg-white p-[25px] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover">
              <div className="mb-3.5 flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
                <Columns4 className="h-[18px] w-[18px]" />
              </div>
              <Heading as="h4" size="2xs">
                CDL Preparation
              </Heading>
              <Paragraph className="mt-1.5">
                Air brakes, combination vehicles, and endorsements — covered.
              </Paragraph>
            </div>
            <div className="rounded-[18px] border border-background3 bg-white p-[25px] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover">
              <div className="mb-3.5 flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
                <Globe className="h-[18px] w-[18px]" />
              </div>
              <Heading as="h4" size="2xs">
                Motorcycle Prep
              </Heading>
              <Paragraph className="mt-1.5">
                Two-wheel rules, control drills, and the full MSF-style question
                bank.
              </Paragraph>
            </div>
          </div>
        </div>

        <StateSelectModal
          open={showStateModal}
          onClose={() => setShowStateModal(false)}
        />
      </div>
    </section>
  );
}
