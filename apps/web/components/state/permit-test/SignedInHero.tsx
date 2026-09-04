"use client";

import { useState } from "react";
import ExamTakenDialog from "@/components/state/permit-test/ExamTakenDialog";
import HandUnderline from "@/components/ui/HandUnderline";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useExamDate } from "@/lib/useExamDate";
import { useWebLayout } from "@/lib/web-layout-context";

function formatExamDate(date: string): string {
  // Split rather than `new Date(date)` so a Y-m-d string isn't shifted a day by the viewer's
  // timezone — it's a calendar date, not an instant.
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The hero a signed-in learner gets: no pitch, just where they are and what's next. The marketing
 * hero ("Start your Free … Practice Test") stays for visitors who haven't signed up yet.
 *
 * "Reschedule exam date" is a placeholder link for now; the date is still editable from the
 * progress rail's pencil, which writes through the same useExamDate hook.
 *
 * "I've taken the written exam" opens the congratulations dialog. There is nothing to record —
 * the API has no concept of an exam having been sat — so it asks for a review instead, which is
 * what that moment is actually good for.
 */
export default function SignedInHero() {
  const { selectedState, selectedTestType } = useWebLayout();
  const { examDate } = useExamDate();
  const [examTakenOpen, setExamTakenOpen] = useState(false);

  const isPermitTrack = selectedTestType === "permit_test";
  const examLabel = isPermitTrack ? "knowledge" : "driving";

  return (
    <section className="px-5 py-12 lg:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <Heading as="h1" size="xl" className="text-center">
          Let&apos;s prepare for your{" "}
          <span className="relative inline-block whitespace-nowrap">
            {selectedState}
            <HandUnderline />
          </span>{" "}
          {`DMV ${examLabel} exam`}
        </Heading>
        <Paragraph size="xl" className="text-center">
          {`Here's how you're tracking towards passing your ${selectedState} DMV exam.`}
        </Paragraph>

        {isPermitTrack && (
          <button
            type="button"
            onClick={() => setExamTakenOpen(true)}
            className="mt-4 inline-flex h-13 cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-8 text-base font-semibold text-white transition-colors hover:bg-blue-700"
          >
            I&apos;ve taken the written exam
          </button>
        )}

        <a
          href="#"
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          {examDate
            ? `Reschedule exam date · ${formatExamDate(examDate)}`
            : "Set your exam date"}
        </a>
      </div>

      <ExamTakenDialog open={examTakenOpen} onOpenChange={setExamTakenOpen} />
    </section>
  );
}
