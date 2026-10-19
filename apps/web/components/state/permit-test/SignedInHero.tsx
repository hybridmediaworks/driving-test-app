"use client";

import { useState } from "react";
import ExamDateDialog from "@/components/state/permit-test/ExamDateDialog";
import ExamFeedbackDialog from "@/components/state/permit-test/ExamFeedbackDialog";
import ExamTakenDialog from "@/components/state/permit-test/ExamTakenDialog";
import Button from "@/components/ui/Button";
import HandUnderline from "@/components/ui/HandUnderline";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useExamDate } from "@/lib/useExamDate";
import { useNextQuizSlug } from "@/lib/usePhaseCompletion";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";
import { ArrowRight } from "lucide-react";

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
 * "Reschedule exam date" opens the calendar. It writes through the same useExamDate hook as the
 * progress rail's pencil, so both see the new date immediately.
 *
 * "I've taken the written exam" asks how it went — a rating, optionally a few words and a photo —
 * and thanks them once that is stored. Sitting the exam itself isn't recorded: the app has no way
 * to know whether it happened, and the useful part of the moment is the verdict, not the claim.
 */
export default function SignedInHero() {
  const { selectedState, selectedTestType } = useWebLayout();
  const { examDate } = useExamDate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [examDateOpen, setExamDateOpen] = useState(false);

  const isPermitTrack = selectedTestType === "permit_test";
  const examLabel = isPermitTrack ? "knowledge" : "driving";

  // Same two actions the signed-out hero offers: jump into the next test, or browse all of them.
  const { selectedVehicle } = useWebLayout();
  const testTrack = isPermitTrack ? "permit_test" : "driving_test";
  const vehicleType = selectedVehicle === "CDL" ? "cdl" : selectedVehicle === "Motorcycle" ? "motorcycle" : "car";
  const nextSlug = useNextQuizSlug(testTrack);
  const nextQuiz = useResolvedQuiz(nextSlug ?? "");
  const allTestsHref = `/quizzes?state=${stateAbbreviations[selectedState]}&vehicle_type=${vehicleType}&test_track=${testTrack}`;
  const startHref = nextSlug ? `/${stateToSlug(selectedState)}/${nextSlug}` : allTestsHref;
  const testLabel = !isPermitTrack ? "Driving" : selectedVehicle === "CDL" ? "CDL" : selectedVehicle === "Motorcycle" ? "Motorcycle" : "Permit";

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

        <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button className="w-full sm:w-fit" href={startHref}>
            {nextQuiz?.in_progress
              ? `Continue: ${nextQuiz.title} (${nextQuiz.in_progress.answered}/${nextQuiz.in_progress.total})`
              : `Start ${selectedState} ${testLabel} Practice Test`}{" "}
            <ArrowRight />
          </Button>
          <Button className="w-full sm:w-fit" variant="outline" href={allTestsHref}>
            View all tests
          </Button>
        </div>

        {isPermitTrack && (
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="mt-4 inline-flex h-13 cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-8 text-base font-semibold text-white transition-colors hover:bg-blue-700"
          >
            I&apos;ve taken the written exam
          </button>
        )}

        <button
          type="button"
          onClick={() => setExamDateOpen(true)}
          className="cursor-pointer rounded-sm text-sm font-semibold text-blue-700 hover:underline focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none dark:text-blue-300"
        >
          {examDate
            ? `Reschedule exam date · ${formatExamDate(examDate)}`
            : "Set your exam date"}
        </button>
      </div>

      <ExamFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSubmitted={() => setThanksOpen(true)}
      />
      <ExamTakenDialog open={thanksOpen} onOpenChange={setThanksOpen} />
      <ExamDateDialog open={examDateOpen} onOpenChange={setExamDateOpen} />
    </section>
  );
}
