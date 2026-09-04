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
 * "I've taken the written exam" opens the congratulations dialog. There is nothing to record —
 * the API has no concept of an exam having been sat — so it asks for a review instead, which is
 * what that moment is actually good for.
 */
export default function SignedInHero() {
  const { selectedState, selectedTestType } = useWebLayout();
  const { examDate, save, saving, error } = useExamDate();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(examDate ?? "");
  const [examTakenOpen, setExamTakenOpen] = useState(false);

  const isPermitTrack = selectedTestType === "permit_test";
  const examLabel = isPermitTrack ? "knowledge" : "driving";

  function startEditing() {
    setValue(examDate ?? "");
    setEditing(true);
  }

  async function submit() {
    if (await save(value)) setEditing(false);
  }

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

        {editing ? (
          <div className="mt-2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="hero-exam-date" className="sr-only">
                Exam date
              </label>
              <input
                id="hero-exam-date"
                type="date"
                value={value}
                disabled={saving}
                onChange={(event) => setValue(event.target.value)}
                className="border-border rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900"
              />
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-2 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            {examDate
              ? `Reschedule exam date · ${formatExamDate(examDate)}`
              : "Set your exam date"}
          </button>
        )}
      </div>

      <ExamTakenDialog open={examTakenOpen} onOpenChange={setExamTakenOpen} />
    </section>
  );
}
