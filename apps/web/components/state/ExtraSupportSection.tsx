"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/**
 * Re-labels the exported cheat-sheet cover for the state actually being viewed: a panel matching
 * the artwork's own blue gradient covers the baked-in "West Virginia / Permit test cheat sheet"
 * block, and the live state name is drawn back over it. Geometry is in percentages measured off
 * the 650×470 export (blue panel x 36.15%→62.92%, text block y 30%→63.5%) and the type is sized
 * in `cqw` so it tracks the card width at every breakpoint.
 */
function CheatSheetCover({ state }: { state: string }) {
  return (
    <div className="relative w-full" style={{ containerType: "inline-size" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/state-hub/support-cheatsheet.png"
        alt=""
        className="w-full rounded-[20px] object-cover"
      />
      <div
        className="absolute flex flex-col items-center justify-center overflow-hidden text-center leading-none text-white"
        style={{
          left: "36.15%",
          right: "37.08%",
          top: "31%",
          bottom: "35%",
          background: "linear-gradient(180deg, #1D4ACC 0%, #1D44BB 100%)",
        }}
      >
        <span
          className="font-sora font-bold"
          style={{
            fontSize: state.length > 11 ? "4.4cqw" : "5.6cqw",
            lineHeight: 1.08,
          }}
        >
          {state}
        </span>
        {/* Two spans, not a wrapped string — the artwork breaks it "Permit test / cheat sheet". */}
        <span
          className="font-sora flex flex-col font-bold"
          style={{ fontSize: "3.85cqw", lineHeight: 1.18, marginTop: "1.4cqw" }}
        >
          <span>Permit test</span>
          <span>cheat sheet</span>
        </span>
      </div>
    </div>
  );
}

/**
 * "The extra support" — the four downloadable-guide cards with their phone-mockup covers
 * (Figma node 4147:8283). Covers are exported straight from the design; each card links to the
 * real browse page that actually holds that material (cheat sheets, road-sign flashcards, the
 * practice-test list) rather than to a promised-but-missing download.
 */
export default function ExtraSupportSection() {
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const query = `state=${stateCode}&vehicle_type=${vehicleType}`;

  const cards = [
    {
      title: `${selectedState} Permit Test Cheat Sheet`,
      label: selectedState,
      tone: "text-blue-600 dark:text-blue-400",
      image: "/state-hub/support-cheatsheet.png",
      // The exported cover has "West Virginia" baked into its phone screen, so the state name and
      // strapline are re-drawn over the flat blue panel instead of shipping WV art to 49 states.
      cover: <CheatSheetCover state={selectedState} />,
      href: `/cheat-sheets?${query}`,
    },
    {
      title: "The 120 Most Common US Road Signs",
      label: "Road signs",
      tone: "text-red-600 dark:text-red-400",
      image: "/state-hub/support-signs.png",
      href: `/flashcards?${query}`,
    },
    {
      title: "The Top 100 Most Common US DMV Questions",
      label: "Questions",
      tone: "text-amber-600 dark:text-amber-400",
      image: "/state-hub/support-questions.png",
      href: `/quizzes?${query}&test_track=${selectedTestType}`,
    },
    {
      title: "10 Things You Should Do Before Your DMV Exam",
      label: "Checklist",
      tone: "text-green-600 dark:text-green-400",
      image: "/state-hub/support-checklist.png",
      href: "/before-your-exam",
    },
  ];

  return (
    <section id="extra-support" className="scroll-mt-6 bg-background2 px-5 py-15 lg:py-28">
      <div className="mx-auto max-w-container">
        <div className="max-w-[706px]">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
            The extra support
          </p>
          <Heading as="h2" size="md" weight="bold" className="mt-3">
            Guides to keep it fresh
          </Heading>
          <Paragraph color="muted" className="mt-3">
            Downloadable references to take on the go. Brush up whenever you need.
          </Paragraph>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 pb-6 shadow-hover transition-transform duration-300 hover:-translate-y-1"
            >
              {card.cover ?? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.image}
                  alt=""
                  className="w-full rounded-[20px] object-cover"
                />
              )}
              <div className="flex flex-1 flex-col px-5">
                <p className={`text-xs font-bold uppercase tracking-[0.08em] ${card.tone}`}>{card.label}</p>
                <h3 className="mt-2 font-sora text-lg leading-snug font-bold text-neutral-900 dark:text-neutral-100">
                  <Link href={card.href} className="after:absolute after:inset-0 after:content-['']">
                    {card.title}
                  </Link>
                </h3>
                <div className="mt-auto pt-4">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    aria-label={`Download ${card.title}`}
                    className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline dark:text-blue-400"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
