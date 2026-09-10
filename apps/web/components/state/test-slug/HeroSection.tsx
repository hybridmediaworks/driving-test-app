"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import HandUnderline from "@/components/ui/HandUnderline";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateToSlug } from "@/lib/usStates";
import { questionsToPass } from "@/lib/quizPassMark";
import { TRUSTPILOT_MAX, TRUSTPILOT_REVIEW_COUNT, TRUSTPILOT_SCORE } from "@/lib/socialProof";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useStateStats } from "@/lib/useStateStats";
import { ArrowRight, CircleCheck, Clock, RotateCcw, SignalHigh } from "lucide-react";

/** The four exam topics the Figma hero lists under "Tricky exam topics covered here" — they're
 * marketing copy about the permit test in general, not per-quiz data the API returns. */
const TRICKY_TOPICS = [
  "Right-of-way at 4-way stops",
  "Blood alcohol limits by age",
  "Parking on a grade",
  "Flashing red vs. flashing yellow",
];

function formatMinutes(durationSeconds: number | null | undefined): string | null {
  if (!durationSeconds) return null;
  const minutes = Math.round(durationSeconds / 60);
  return minutes > 0 ? `${minutes} min` : null;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-background3 dark:border-white/10 bg-white dark:bg-neutral-800 px-3.75 py-2.25 text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {children}
    </span>
  );
}

export default function HeroSection({ testSlug }: { testSlug: string }) {
  const { selectedState } = useWebLayout();
  const stateSlug = stateToSlug(selectedState);
  const quiz = useResolvedQuiz(testSlug);
  const stats = useStateStats();

  const isDrivingTest = quiz?.test_track === "driving_test";
  const quizHref = `/${stateSlug}/${testSlug}/quiz`;
  const duration = formatMinutes(quiz?.duration_seconds);
  const toPass = quiz ? questionsToPass(quiz) : null;

  const statCards = [
    stats?.pass_rate != null && {
      value: `${stats.pass_rate}%`,
      label: `Avg. pass rate on our ${selectedState} tests`,
    },
    quiz?.pass_rate != null && {
      value: `${quiz.pass_rate}%`,
      label: "Average pass rate for this test",
    },
    stats && {
      value: stats.students_practiced_30d.toLocaleString(),
      label: `${selectedState} learners practiced (30d)`,
    },
  ].filter((c): c is { value: string; label: string } => !!c);

  return (
    <section className="px-5 py-15 lg:py-24">
      <div className="mx-auto flex max-w-container flex-col items-center gap-18 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
        {/* Left column — headline, proof numbers, CTA */}
        <div className="w-full space-y-8 xl:max-w-175">
          <div className="space-y-4">
            <Heading as="h1">
              {quiz === null ? (
                "Test not found"
              ) : (
                <>
                  Free{" "}
                  <span className="relative inline-block whitespace-nowrap">
                    {selectedState}
                    <HandUnderline />
                  </span>{" "}
                  DMV {isDrivingTest ? "Driving" : "Permit"} Practice Test 2026
                </>
              )}
            </Heading>
            <Paragraph size="xl" className="max-w-175">
              {typeof quiz?.total_questions === "number" ? `${quiz.total_questions} questions` : "Questions"} written
              from the current {selectedState} Driver Handbook. Answer, see why, and find out which topics would fail
              you, before the DMV does.
            </Paragraph>

            {statCards.length > 0 && (
              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="flex-1 rounded-[14px] border border-background3 dark:border-white/10 bg-white dark:bg-neutral-800 px-6.25 py-4.75 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  >
                    <p className="font-sora text-[36px] leading-11 font-semibold tracking-[-0.72px] text-neutral-900 dark:text-neutral-100">
                      {card.value}
                    </p>
                    <Paragraph size="sm" color="muted" className="max-w-35">
                      {card.label}
                    </Paragraph>
                  </div>
                ))}
              </div>
            )}
          </div>

          {quiz?.in_progress && !quiz.locked ? (
            // Left this test partway through → offer to pick up where they left off instead of
            // either the first-time "Start" or the completed "Restart/View results" CTA.
            <Button className="w-full to-blue-800! md:w-fit" href={quizHref}>
              Continue: {quiz.title} ({quiz.in_progress.answered}/{quiz.in_progress.total}) <ArrowRight />
            </Button>
          ) : quiz?.attempted && !quiz.locked ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-fit">
              <Button className="w-full to-blue-800! sm:w-fit" href={quizHref}>
                <RotateCcw /> Restart
              </Button>
              <Button className="w-full sm:w-fit" variant="outline" href={`${quizHref}?view=results`}>
                View results
              </Button>
            </div>
          ) : (
            <Button className="w-full to-blue-800! md:w-fit" href={quizHref} disabled={!quiz}>
              {quiz?.locked ? `Unlock ${quiz.title}` : "Start Your First Free Practice Test"} <ArrowRight />
            </Button>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Paragraph className="flex items-center gap-1" size="sm">
              <CircleCheck className="h-6 w-6 text-green-500" /> 5-min quizzes
            </Paragraph>
            <Paragraph className="flex items-center gap-1" size="sm">
              <CircleCheck className="h-6 w-6 text-green-500" /> No signup required
            </Paragraph>
            {quiz?.category?.title && (
              <Paragraph className="flex items-center gap-1" size="sm">
                <CircleCheck className="h-6 w-6 text-green-500" /> Part of our {quiz.category.title} set
              </Paragraph>
            )}
          </div>
        </div>

        {/* Right column — the blue proof panel is inset 22px on each side, and the test card is
            wider than it, hanging over both edges and 83px above its top (Figma 4182:4322). */}
        <div className="w-full max-w-141.75 shrink-0 px-5.5 pt-14 sm:pt-20.75">
          <div className="relative flow-root space-y-5 rounded-[32px] bg-blue-100 dark:bg-blue-500/10 px-5.5 pb-10 shadow-[0px_12px_40.793px_-21.212px_rgba(23,37,84,0.12)]">
            <div className="absolute inset-0 z-0 overflow-hidden rounded-[32px]">
              <div className="absolute -bottom-1/2 -left-1/2 z-0 aspect-square h-full w-full rounded-full bg-white dark:bg-neutral-800 blur-[125px]" />
            </div>

            <div className="relative z-10 -mx-5.5 -mt-14 w-[calc(100%+44px)] sm:-mx-11 sm:-mt-20.75 sm:w-[calc(100%+88px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={quiz?.cover_image_url ?? "/signature-license.png"}
                alt=""
                className="relative w-full rounded-xl md:rounded-2xl shadow-[inset_0_1.565px_0_0_rgba(255,255,255,0.22),inset_0_0_0_1.565px_rgba(255,255,255,0.09),0_37.571px_78.273px_-34.44px_rgba(8,9,12,0.55),0_12.524px_31.309px_-18.786px_rgba(8,9,12,0.45)]"
              />
              <div className="absolute bottom-4 flex w-full flex-wrap items-center justify-center gap-2.5">
                <Chip>
                  <SignalHigh className="h-4 w-4 text-yellow-500" />
                  {quiz?.is_premium ? "Premium" : "Free"}
                </Chip>
                {duration && (
                  <Chip>
                    <Clock className="h-4 w-4" />
                    {duration}
                  </Chip>
                )}
                {typeof quiz?.total_questions === "number" && (
                  <Chip>
                    {quiz.total_questions} questions{toPass !== null && ` · ${toPass} to pass`}
                  </Chip>
                )}
              </div>
            </div>

            <div className="relative z-10 space-y-4 pt-4">
              <Paragraph className="flex flex-wrap items-center justify-center gap-3 font-semibold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/trustpilotstar.svg" alt="" /> Trustpilot {TRUSTPILOT_SCORE}/{TRUSTPILOT_MAX} from{" "}
                {TRUSTPILOT_REVIEW_COUNT} students
              </Paragraph>

              <div className="space-y-4">
                <Paragraph className="text-center font-semibold">Tricky exam topics covered here:</Paragraph>
                <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-2.5">
                  {TRICKY_TOPICS.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-background3 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-3.75 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {stats && (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                  <Paragraph size="sm">
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      {stats.questions_answered_total.toLocaleString()} answers
                    </strong>{" "}
                    logged today statewide
                  </Paragraph>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
