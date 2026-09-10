"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useStateStats } from "@/lib/useStateStats";
import { useWebLayout } from "@/lib/web-layout-context";

/** Bar fill per score band, in the same order the API returns them (highest band first). */
const BAND_COLORS = ["bg-blue-600", "bg-blue-300", "bg-green-300", "bg-yellow-200", "bg-red-300"];

const RING_RADIUS = 124;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * "How {state} learners score first time" — the score-band histogram plus the average first-try
 * ring, both read from GET /states/{code}/stats. Renders nothing until the state has graded
 * attempts to describe, rather than drawing five empty bars.
 */
export default function ScoreDistributionSection() {
  const { selectedState } = useWebLayout();
  const stats = useStateStats();

  const distribution = stats?.score_distribution;
  if (!stats || !distribution || distribution.length === 0) return null;

  const peak = Math.max(...distribution.map((band) => band.percent), 1);
  // Read the bands by position rather than by label — the API returns them highest-first, and
  // the labels themselves are display strings (en dashes) that shouldn't be matched on.
  const eightyPlus = distribution.slice(0, 2).reduce((sum, band) => sum + band.percent, 0);
  const underSixty = distribution[distribution.length - 1]?.percent ?? 0;
  const avgFirstTry = stats.avg_first_try_score;

  return (
    // Pulled 239px up into the tinted band above so the card sits half on each background, with
    // the ring hanging clear into that band (Figma node 4213:1766 vs the section above it). No
    // padding of its own: the section below brings its 120px.
    <section className="px-5 py-15 lg:-mt-[239px] lg:py-0">
      <div className="relative mx-auto max-w-container">
        <div className="rounded-[48px] bg-[radial-gradient(120%_140%_at_0%_0%,#ffffff_0%,#f0fdf4_34%,#ffffff_54%,#f0fdf4_77%,#ffffff_100%)] dark:bg-none dark:bg-neutral-800 px-6 py-12 drop-shadow-[0px_20px_20px_rgba(11,11,13,0.1)] lg:px-24 lg:py-15">
          {/* 514 of copy, 136 of air, 514 of chart — the card's 1168px content width in Figma
              (node 4213:1766), so the histogram sits flush with the card's right padding. */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="w-full space-y-4 lg:w-128.5 lg:min-w-0">
              <Heading as="h2">How {selectedState} learners score first time</Heading>
              <Paragraph size="xl">
                Based on {stats.students_practiced_30d.toLocaleString()} {selectedState} learners who practiced on our
                site in the last 30 days.
                {stats.pass_rate != null && ` ${stats.pass_rate}% pass our practice tests`}
                {avgFirstTry != null && `, with an average first-try score of ${avgFirstTry}%`}.
              </Paragraph>
            </div>

            {/* Histogram — each column is sized against the tallest band so the shape stays
                readable whatever the real spread turns out to be. */}
            <div className="flex w-full items-end justify-between gap-3.5 lg:w-128.5 lg:min-w-0">
              {distribution.map((band, index) => (
                <div key={band.label} className="flex flex-1 flex-col items-center gap-2.5">
                  <p className="font-sora text-xl leading-9.5 font-semibold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                    {band.percent}%
                  </p>
                  <div
                    className={`w-full rounded-t-md ${BAND_COLORS[index] ?? "bg-blue-300"}`}
                    style={{ height: `${Math.max((band.percent / peak) * 226, 6)}px` }}
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
        {avgFirstTry != null && (
          <div className="mx-auto mt-8 w-70 lg:absolute lg:-top-16.75 lg:right-16 lg:mt-0">
            <div className="relative size-70">
              <svg viewBox="0 0 280 280" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
                <circle cx="140" cy="140" r={RING_RADIUS} fill="none" stroke="#ffffff" strokeWidth="14" />
                <circle
                  cx="140"
                  cy="140"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${(avgFirstTry / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                />
              </svg>
              <div className="absolute inset-3.5 flex flex-col items-center justify-center gap-2 rounded-full bg-white dark:bg-neutral-800 px-8 text-center drop-shadow-[0px_1px_1px_rgba(14,17,22,0.06),0px_2px_3px_rgba(14,17,22,0.05)]">
                <p className="font-sora text-5xl leading-14 font-semibold tracking-[-0.96px] text-blue-700 dark:text-blue-400">
                  {avgFirstTry}%
                </p>
                <Paragraph className="text-center">
                  Average first-try score across DriveLane’s {selectedState} practice tests.
                </Paragraph>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
