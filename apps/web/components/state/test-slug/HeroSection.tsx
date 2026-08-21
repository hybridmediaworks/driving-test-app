"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateToSlug } from "@/lib/usStates";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useStateStats } from "@/lib/useStateStats";
import { ArrowRight, BadgeCheck, Clock, SignalHigh } from "lucide-react";

function formatMinutes(durationSeconds: number | null | undefined): string | null {
  if (!durationSeconds) return null;
  const minutes = Math.round(durationSeconds / 60);
  return minutes > 0 ? `${minutes} min` : null;
}

export default function HeroSection({ testSlug }: { testSlug: string }) {
  const { selectedState } = useWebLayout();
  const stateSlug = stateToSlug(selectedState);
  const quiz = useResolvedQuiz(testSlug);
  const stats = useStateStats();

  const isDrivingTest = quiz?.test_track === "driving_test";
  const quizHref = `/${stateSlug}/${testSlug}/quiz`;
  const duration = formatMinutes(quiz?.duration_seconds);

  const statCards = [
    stats?.pass_rate != null && {
      value: `${stats.pass_rate}%`,
      label: `Avg. pass rate on our ${selectedState} tests`,
    },
    quiz?.pass_rate != null && {
      value: `${quiz.pass_rate}%`,
      label: "Pass rate for this test",
    },
    stats && {
      value: stats.students_practiced_30d.toLocaleString(),
      label: `${selectedState} learners practiced (30d)`,
    },
  ].filter((c): c is { value: string; label: string } => !!c);

  return (
    <section className="py-15 lg:py-30 px-5">
      <div className="mx-auto max-w-container  flex flex-col xl:flex-row justify-between xl:gap-4 md:gap-26 gap-18">
        <div className="space-y-4 xl:max-w-165">
          <Paragraph
            size="md"
            className="flex max-w-fit font-semibold items-center gap-2 rounded-full border bg-white px-3.75 py-2.25 shadow-card"
          >
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className=" text-green-500">Live</span>
            <span>
              Active learners today: <strong>{stats ? stats.active_today.toLocaleString() : "—"}</strong>
            </span>
          </Paragraph>
          <Heading as="h1">
            {quiz === null ? (
              `Test not found`
            ) : (
              <>
                Free <span className="text-blue-500">{selectedState}</span> DMV{" "}
                {isDrivingTest ? "Driving" : "Permit"} Practice Test 2026
              </>
            )}
          </Heading>
          <Paragraph size="lg">
            {typeof quiz?.total_questions === "number" ? (
              <>
                {quiz.total_questions} questions written from the current {selectedState} Driver Handbook.
              </>
            ) : (
              <>Questions written from the current {selectedState} Driver Handbook.</>
            )}{" "}
            Answer, see why, and find out which topics would fail you — before the DMV does.
          </Paragraph>
          {statCards.length > 0 && (
            <div className="flex flex-wrap gap-4 py-4">
              {statCards.map((card) => (
                <div key={card.label} className="bg-white border rounded-xl px-6 py-4.5 min-w-37.5 flex-1">
                  <Heading size="sm">{card.value}</Heading>
                  <Paragraph size="sm">{card.label}</Paragraph>
                </div>
              ))}
            </div>
          )}
          <Button className="w-full md:w-fit" href={quizHref} disabled={!quiz}>
            {quiz ? (quiz.locked ? `Unlock ${quiz.title}` : `Start Free: ${quiz.title}`) : "Start Free Practice Test"}{" "}
            <ArrowRight />
          </Button>
          <div className="flex gap-4 flex-wrap">
            <Paragraph className="flex items-center gap-1" size="sm">
              <BadgeCheck className="w-5 h-5 text-green-700" /> 5-min quizzes
            </Paragraph>
            <Paragraph className="flex items-center gap-1" size="sm">
              <BadgeCheck className="w-5 h-5 text-green-700" /> No signup required
            </Paragraph>
            {quiz?.category?.title && (
              <Paragraph className="flex items-center gap-1" size="sm">
                <BadgeCheck className="w-5 h-5 text-green-700" /> Part of our {quiz.category.title} set
              </Paragraph>
            )}
          </div>
        </div>
        <div className="mt-20 max-w-158 relative rounded-[32px] space-y-5 bg-blue-100 px-8 pb-10">
          <div className="w-full h-full absolute overflow-hidden left-0 rounded-[32px] z-0">
            <div className="bg-white blur-[125px] rounded-full aspect-square absolute -left-1/2 -bottom-1/2 w-full h-full z-0" />
          </div>

          <div className="-mt-20 relative z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={quiz?.cover_image_url ?? "/signature-license.png"}
              alt=""
              className="w-full relative rounded-xl md:rounded-[34px] shadow-[inset_0_1.565px_0_0_rgba(255,255,255,0.22),inset_0_0_0_1.565px_rgba(255,255,255,0.09),0_37.571px_78.273px_-34.44px_rgba(8,9,12,0.55),0_12.524px_31.309px_-18.786px_rgba(8,9,12,0.45)]"
            />
            <div className="absolute w-full flex gap-2 items-center justify-center bottom-6">
              {quiz?.is_premium && (
                <div className="min-h-10.5 relative inline-flex px-2.5 py-2 items-center gap-1 bg-white text-sm leading-none whitespace-nowrap border rounded-full text-neutral-700">
                  <SignalHigh className="text-yellow-500" />
                  Premium
                </div>
              )}
              {duration && (
                <div className=" min-h-10.5 relative inline-flex px-2.5 py-2 items-center gap-1 bg-white text-sm leading-none whitespace-nowrap border rounded-full text-neutral-700">
                  <Clock className="text-neutral-700 w-4 h-4" />
                  {duration}
                </div>
              )}
              {typeof quiz?.total_questions === "number" && (
                <div className=" min-h-10.5 relative inline-flex px-2.5 py-2 items-center gap-1 bg-white text-sm leading-none whitespace-nowrap border rounded-full text-neutral-700">
                  {quiz.total_questions} questions{" "}
                  {typeof quiz.passing_score_percent === "number" && (
                    <span className="hidden lg:inline">· {quiz.passing_score_percent}% to pass</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="relative space-y-5 z-10">
            <Paragraph className="pt-4 flex gap-3 items-center justify-center flex-wrap font-semibold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/trustpilotstar.svg" alt="" /> Trustpilot 4.7/5 from 38,000+ students
            </Paragraph>
          </div>
        </div>
      </div>
    </section>
  );
}
