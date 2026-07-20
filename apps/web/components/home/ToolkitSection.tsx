"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import StateSelectModal from "@/components/home/StateSelectModal";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function ToolkitSection() {
  const { selectedState, hasStoredState } = useWebLayout();
  const [showStateModal, setShowStateModal] = useState(false);

  const stateHref = hasStoredState ? `/${stateToSlug(selectedState)}` : undefined;

  function onStartClick() {
    if (!hasStoredState) {
      setShowStateModal(true);
    }
  }

  return (
    <section className="px-5 pt-0 pb-10 lg:pt-30 lg:pb-15">
      <div className="mx-auto max-w-container space-y-5.5">
        <div className="flex max-w-170 flex-col gap-4">
          <Paragraph
            className="border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
            size="xs"
            color="primary"
          >
            ✦ The toolkit
          </Paragraph>
          <Heading as="h2">Everything that helps you ace it.</Heading>
        </div>
        <div className="flex items-center gap-3.5 pt-5 md:pt-9.5">
          <Paragraph className="flex min-w-fit gap-3.5 font-semibold tracking-[1.2px] uppercase" size="xs">
            <span>01</span> AI Tutor
          </Paragraph>
          <div className="h-px w-full bg-[#E7E6E1]" />
        </div>
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
          <div className="w-full space-y-4 lg:max-w-130">
            <Heading as="h3" size="md">
              A tutor that knows where you slip.
            </Heading>
            <Paragraph className="max-w-105">
              Every wrong answer teaches the model something. It rebuilds your plan in real time, so
              practice always targets your weakest signs, rules, and reflexes.
            </Paragraph>
            <ul className="space-y-2.75 pt-1.5">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 rounded-md bg-blue-100 px-0.5 text-blue-500" />
                <Paragraph>Explained answers, not just right/wrong</Paragraph>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 rounded-md bg-blue-100 px-0.5 text-blue-500" />
                <Paragraph>Adaptive weak-spot drills after every session</Paragraph>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 rounded-md bg-blue-100 px-0.5 text-blue-500" />
                <Paragraph>Ask follow-ups in plain language, any time</Paragraph>
              </li>
            </ul>
            <Button
              variant="ghost"
              className="mt-2.5 p-0!"
              href={stateHref}
              onClick={onStartClick}
            >
              {hasStoredState ? `Start Free ${selectedState} Practice Test` : "Try it for free"}{" "}
              <ArrowRight />
            </Button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ai-tutor.png"
            alt=""
            className="w-full rounded-3xl shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)] lg:w-auto"
          />
        </div>
        <div className="flex items-center gap-3.5 pt-5 md:pt-17">
          <Paragraph className="flex min-w-fit gap-3.5 font-semibold tracking-[1.2px] uppercase" size="xs">
            <span>02</span> Practice &amp; Insight
          </Paragraph>
          <div className="h-px w-full bg-[#E7E6E1]" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-[#E7E6E1] bg-white hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/progress-tracking.png" alt="" className="w-full" />
            <div className="space-y-1.5 p-5">
              <Paragraph size="lg" className="font-semibold">
                Progress Tracking
              </Paragraph>
              <Paragraph>A readiness score that tells you precisely when to book the test.</Paragraph>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E7E6E1] bg-white hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vioce-learning.png" alt="" className="w-full" />
            <div className="space-y-1.5 p-5">
              <Paragraph size="lg" className="font-semibold">
                Voice Learning
              </Paragraph>
              <Paragraph>Listen, answer aloud, and learn while you walk, cook, or commute.</Paragraph>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E7E6E1] bg-white hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/flashcards.png" alt="" className="w-full" />
            <div className="space-y-1.5 p-5">
              <Paragraph size="lg" className="font-semibold">
                Flashcards
              </Paragraph>
              <Paragraph>Spaced repetition that locks signs and rules into long-term memory.</Paragraph>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 pt-5 md:pt-17">
          <Paragraph className="flex min-w-fit gap-3.5 font-semibold tracking-[1.2px] uppercase" size="xs">
            <span>03</span> Exam Mode
          </Paragraph>
          <div className="h-px w-full bg-[#E7E6E1]" />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.20fr)_minmax(0,0.80fr)]">
          <div className="row-span-2 space-y-4.5 rounded-xl border border-[#E7E6E1] bg-white p-6 hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B59FF]">
              ▣
            </div>
            <Paragraph size="lg" className="mb-0 font-semibold" color="dark">
              Mock Exams
            </Paragraph>
            <Paragraph>The real DMV format — timed, scored, and unforgiving in the best way.</Paragraph>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mockexams.svg" alt="" className="w-full" />
          </div>
          <div className="space-y-1.5 rounded-xl border border-[#E7E6E1] bg-white p-6 hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B59FF]">
              ▥
            </div>
            <Paragraph size="lg" className="mb-0 font-semibold" color="dark">
              CDL Preparation
            </Paragraph>
            <Paragraph>Air brakes, combination vehicles, and endorsements — covered.</Paragraph>
          </div>
          <div className="space-y-1.5 rounded-xl border border-[#E7E6E1] bg-white p-6 hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
            <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B59FF]">
              ◍
            </div>
            <Paragraph size="lg" className="mb-0 font-semibold" color="dark">
              Motorcycle Prep
            </Paragraph>
            <Paragraph>Two-wheel rules, control drills, and the full MSF-style question bank.</Paragraph>
          </div>
        </div>

        <StateSelectModal open={showStateModal} onClose={() => setShowStateModal(false)} />
      </div>
    </section>
  );
}
