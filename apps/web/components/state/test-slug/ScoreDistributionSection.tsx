"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useQuizTopics } from "@/lib/useQuizTopics";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useStateStats } from "@/lib/useStateStats";
import { useWebLayout } from "@/lib/web-layout-context";

/** Bar fill per score band, in the same order the API returns them (highest band first). */
const BAND_COLORS = [
  "bg-blue-600",
  "bg-blue-300",
  "bg-green-300",
  "bg-yellow-200",
  "bg-red-300",
];

/** Ring geometry, straight off Figma's own asset (node 4260:11351): a 268px plate holding a
 * 126px-radius circle under a 16px round-capped stroke, with a neutral-100 track behind the
 * brand-blue progress arc. The plate sits centred in the 280px box the design gives the ring. */
const RING_BOX = 268;
const RING_RADIUS = 126;
const RING_STROKE = 16;
const RING_TRACK = "#F5F5F5";
const RING_PROGRESS = "#3B82F6";
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Stand-in bands for a state with nothing graded yet — same labels the API returns, all at zero. */
const EMPTY_DISTRIBUTION = [
  { label: "90–100", percent: 0 },
  { label: "80–89", percent: 0 },
  { label: "70–79", percent: 0 },
  { label: "60–69", percent: 0 },
  { label: "<60", percent: 0 },
];

/**
 * "How {state} learners score first time" — the score-band histogram plus the average first-try
 * ring, both read from GET /states/{code}/stats. Renders nothing until the state has graded
 * attempts to describe, rather than drawing five empty bars.
 */
export default function ScoreDistributionSection({
  testSlug,
}: {
  testSlug: string;
}) {
  const { selectedState } = useWebLayout();
  const stats = useStateStats();
  // The card only straddles a colour change when the topic breakdown above it actually rendered
  // its tinted band. When that section hides (a quiz whose questions carry no topic), pulling up
  // would drag the card over the banner above instead.
  const quiz = useResolvedQuiz(testSlug);
  const hasBandAbove = useQuizTopics(quiz?.id).length > 0;

  // The section always renders: a state with no graded attempts yet shows the five bands sitting
  // at zero rather than vanishing and leaving a hole in the page.
  const distribution = stats?.score_distribution?.length
    ? stats.score_distribution
    : EMPTY_DISTRIBUTION;
  const hasData = (stats?.score_distribution?.length ?? 0) > 0;

  const peak = Math.max(...distribution.map((band) => band.percent), 1);
  // Read the bands by position rather than by label — the API returns them highest-first, and
  // the labels themselves are display strings (en dashes) that shouldn't be matched on.
  const eightyPlus = distribution
    .slice(0, 2)
    .reduce((sum, band) => sum + band.percent, 0);
  const underSixty = distribution[distribution.length - 1]?.percent ?? 0;
  const avgFirstTry = stats?.avg_first_try_score ?? null;
  const learners = stats?.students_practiced_30d ?? 0;

  return (
    <section
      className={`px-5 py-15 lg:py-0 ${hasBandAbove ? "lg:-mt-[239px]" : "lg:pt-30"}`}
    >
      <div className="relative mx-auto max-w-container">
        <div className="rounded-[48px] bg-[radial-gradient(120%_140%_at_0%_0%,#ffffff_0%,#f0fdf4_34%,#ffffff_54%,#f0fdf4_77%,#ffffff_100%)] dark:bg-none dark:bg-neutral-800 px-6 py-12 drop-shadow-[0px_20px_20px_rgba(11,11,13,0.1)] lg:px-24 lg:py-15">
          {/* 514 of copy, 136 of air, 514 of chart — the card's 1168px content width in Figma
              (node 4213:1766), so the histogram sits flush with the card's right padding. */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="w-full space-y-4 lg:w-128.5 lg:min-w-0">
              <Heading as="h2">
                How {selectedState} learners score first time
              </Heading>
              <Paragraph size="xl">
                {hasData ? (
                  <>
                    Based on {learners.toLocaleString()} {selectedState}{" "}
                    learners who practiced on our site in the last 30 days.
                    {stats?.pass_rate != null &&
                      ` ${stats.pass_rate}% pass our practice tests`}
                    {avgFirstTry != null &&
                      `, with an average first-try score of ${avgFirstTry}%`}
                    .
                  </>
                ) : (
                  <>
                    No {selectedState} learner has finished a graded test yet —
                    these bands fill in as soon as they do.
                  </>
                )}
              </Paragraph>
            </div>

            {/* Histogram — each column is sized against the tallest band so the shape stays
                readable whatever the real spread turns out to be. */}
            <div className="flex w-full items-end justify-between gap-3.5 lg:w-128.5 lg:min-w-0">
              {distribution.map((band, index) => (
                <div
                  key={band.label}
                  className="flex flex-1 flex-col items-center gap-2.5"
                >
                  <p className="font-sora text-xl leading-9.5 font-semibold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                    {band.percent}%
                  </p>
                  <div
                    className={`w-full rounded-t-md ${BAND_COLORS[index] ?? "bg-blue-300"}`}
                    style={{
                      height: `${Math.max((band.percent / peak) * 226, 6)}px`,
                    }}
                  />
                  <Paragraph size="sm" className="text-center">
                    {band.label}
                  </Paragraph>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-between gap-4 border-y border-background3 dark:border-white/10 py-4 lg:flex-row">
            <span className="flex items-center gap-2.5">
              <span className="size-3.5 shrink-0 rounded bg-blue-600" />
              <Paragraph size="sm" color="muted">
                {eightyPlus}% of learners score 80 or above on attempt one
              </Paragraph>
            </span>
            <span className="flex items-center gap-2.5">
              <span className="size-3.5 shrink-0 rounded bg-blue-300" />
              <Paragraph size="sm" color="muted">
                Most who finish every test in the ladder pass the real exam
              </Paragraph>
            </span>
            <span className="flex items-center gap-2.5">
              <span className="size-3.5 shrink-0 rounded bg-red-300" />
              <Paragraph size="sm" color="muted">
                {underSixty}% score under 60, usually before studying signs
              </Paragraph>
            </span>
          </div>
        </div>

        {/* Average first-try ring — overlaps the card's top-right corner on desktop, and drops
            back into the flow on narrow screens where there's no corner to hang off. */}
        <div className="mx-auto mt-8 w-70 lg:absolute lg:-top-16.75 lg:right-16 lg:mt-0">
          <div className="relative size-70">
            {/* Disc first, ring over it — the order Figma uses (node 4260:11340 paints
                before 4260:11351), so the stroke keeps its full 16px instead of having its
                inner half covered by the disc. */}
            <div className="absolute inset-3.5 flex flex-col items-center justify-center gap-2 rounded-full bg-white dark:bg-neutral-800 px-8 text-center drop-shadow-[0px_1px_1px_rgba(14,17,22,0.06),0px_2px_3px_rgba(14,17,22,0.05)]">
              <p
                className={`font-sora text-5xl leading-14 font-semibold tracking-[-0.96px] ${
                  avgFirstTry == null
                    ? "text-neutral-400 dark:text-neutral-500"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                {avgFirstTry == null ? "—" : `${avgFirstTry}%`}
              </p>
              <Paragraph className="text-center">
                Average first-try score across DriveLane’s {selectedState}{" "}
                practice tests.
              </Paragraph>
            </div>
            <svg
              viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
              className="absolute inset-1.5 -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={RING_BOX / 2}
                cy={RING_BOX / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={RING_TRACK}
                strokeWidth={RING_STROKE}
              />
              <circle
                cx={RING_BOX / 2}
                cy={RING_BOX / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={RING_PROGRESS}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${((avgFirstTry ?? 0) / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
