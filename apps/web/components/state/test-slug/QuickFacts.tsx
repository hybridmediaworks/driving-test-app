"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PaginatedResponse, PublicCheatSheet, State } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { passingScorePercent, questionsToPass } from "@/lib/quizPassMark";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useWebLayout } from "@/lib/web-layout-context";
import {
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Globe,
  MapPinned,
  MonitorCheck,
  RotateCcw,
  Timer,
  UserRound,
  Car,
  type LucideIcon,
} from "lucide-react";

type Fact = {
  icon: LucideIcon;
  /** Tailwind background for the 40px icon tile — the per-fact hue from Figma. */
  tone: string;
  label: string;
  value: string;
  link?: { label: string; href: string; external?: boolean };
  /** Takes the rest of its row (the long "what to bring" list), so the grid never ends on an
   * empty cell. */
  wide?: boolean;
};

/** How far the last (wide) cell has to stretch to finish its row, by the column it starts in. */
const WIDE_SPANS = ["lg:col-span-4", "lg:col-span-3", "lg:col-span-2", ""];

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

function formatMinutes(durationSeconds: number | null | undefined): string | null {
  if (!durationSeconds) return null;
  const minutes = Math.round(durationSeconds / 60);
  return minutes > 0 ? `${minutes} mins` : null;
}

function formatFee(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function pluralise(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

/**
 * "{ST} permit test at a glance" — the eleven-cell facts grid from Figma (node 4195:1403). Test
 * shape (questions, pass mark, time limit) comes off the quiz; the legal requirements (fee,
 * retake wait, supervised hours, minimum age, languages, online testing) off the state record,
 * where an admin publishes them. Any fact with no value is dropped rather than guessed, so a
 * state that hasn't been filled in yet shows a shorter — but never wrong — grid.
 */
export default function QuickFacts({ testSlug }: { testSlug: string }) {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const quiz = useResolvedQuiz(testSlug);
  const [stateInfo, setStateInfo] = useState<State | null>(null);
  const [checklist, setChecklist] = useState<PublicCheatSheet | null>(null);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<{ data: State[] }>("/states")
      .then((res) => {
        if (!cancelled) setStateInfo(res.data.find((s) => s.code === stateCode) ?? null);
      })
      .catch(() => {
        if (!cancelled) setStateInfo(null);
      });

    // The "what to bring" cell links to the state's own cheat sheet when there is one — that's
    // the closest thing we publish to the checklist the design points at.
    api
      .get<PaginatedResponse<PublicCheatSheet>>(`/cheat-sheets?state=${stateCode}&vehicle_type=${vehicleType}`)
      .then((res) => {
        if (!cancelled) setChecklist(res.data[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setChecklist(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType]);

  if (!quiz) return null;

  const isDrivingTest = quiz.test_track === "driving_test";
  const agencyName = stateInfo?.agency_name ?? "DMV";
  const duration = formatMinutes(quiz.duration_seconds);
  const fee = formatFee(stateInfo?.permit_test_fee_cents);
  const toPass = questionsToPass(quiz);

  // Figma order, left to right and top to bottom.
  const facts: (Fact | false)[] = [
    {
      icon: FileText,
      tone: "bg-blue-500",
      label: "Questions",
      value: String(quiz.total_questions),
    },
    {
      icon: ClipboardCheck,
      tone: "bg-green-500",
      label: "Passing score",
      value: `${toPass} / ${quiz.total_questions}`,
    },
    !!duration && {
      icon: Timer,
      tone: "bg-purple-500",
      label: "Time limit",
      value: duration,
    },
    !!fee && {
      icon: CircleDollarSign,
      tone: "bg-red-500",
      label: "Test fee",
      value: fee,
    },
    stateInfo?.retake_wait_days != null && {
      icon: RotateCcw,
      tone: "bg-blue-600",
      label: "If you fail",
      value:
        stateInfo.retake_wait_days === 0
          ? "Retake same day"
          : `Wait ${pluralise(stateInfo.retake_wait_days, "day")}`,
    },
    stateInfo?.supervised_driving_hours != null && {
      icon: Car,
      tone: "bg-orange-500",
      label: "Supervised hours",
      value: `${stateInfo.supervised_driving_hours} hrs`,
    },
    stateInfo?.minimum_permit_age != null && {
      icon: UserRound,
      tone: "bg-green-600",
      label: "Minimum age",
      value: `${stateInfo.minimum_permit_age} yrs`,
    },
    stateInfo?.test_language_count != null && {
      icon: Globe,
      tone: "bg-yellow-400",
      label: "Test languages",
      value: String(stateInfo.test_language_count),
    },
    stateInfo?.online_testing_available != null && {
      icon: MonitorCheck,
      tone: "bg-purple-600",
      label: "Online testing",
      value: stateInfo.online_testing_available ? "Yes" : "No",
    },
    {
      icon: MapPinned,
      tone: "bg-red-600",
      label: "Where",
      value: `${stateCode} ${agencyName} offices`,
      ...(stateInfo?.dmv_website_url
        ? {
            link: {
              label: `Find ${selectedState} ${agencyName} locations`,
              href: stateInfo.dmv_website_url,
              external: true,
            },
          }
        : {}),
    },
    {
      icon: FileText,
      tone: "bg-blue-400",
      label: "What to bring",
      value: "ID + SSN + residency proof + test fee",
      wide: true,
      ...(checklist ? { link: { label: "Open the checklist", href: `/cheat-sheets/${checklist.id}` } } : {}),
    },
  ];

  const visible = facts.filter((f): f is Fact => f !== false);
  // The wide cell fills whatever is left of its row, so the grid never ends on a blank tile.
  // Spelled out rather than interpolated so Tailwind can see the class names.
  const wideSpan = WIDE_SPANS[(visible.length - 1) % 4];

  return (
    <section className="px-5 py-15 lg:py-30">
      <div className="mx-auto flex max-w-container flex-col items-center gap-15">
        <div className="flex w-full max-w-181 flex-col items-center gap-4 text-center">
          <Heading as="h2">
            {stateCode} {isDrivingTest ? "driving test" : "permit test"} at a glance
          </Heading>
          <Paragraph size="xl">
            Everything the handbook buries on page 60, on one screen. Verified against the{" "}
            {`${selectedState} ${agencyName}’s`} published requirements each quarter.
          </Paragraph>
        </div>

        <div className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-[32px] border border-background3 dark:border-white/10 bg-background3 dark:bg-white/10 p-px shadow-[0px_20px_40px_-10px_rgba(11,11,13,0.1)] sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((fact) => (
            <div
              key={fact.label}
              className={`flex flex-col gap-3 bg-white dark:bg-neutral-800 px-9 py-6 ${
                fact.wide ? `sm:col-span-2 ${wideSpan}` : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${fact.tone}`}>
                  <fact.icon className="size-5 text-white" />
                </span>
                <div className="space-y-1">
                  <Paragraph>{fact.label}</Paragraph>
                  <p className="font-sora text-2xl leading-8 font-semibold text-neutral-900 dark:text-neutral-100">
                    {fact.value}
                  </p>
                </div>
              </div>
              {fact.link &&
                (fact.link.external ? (
                  <a
                    href={fact.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 dark:text-blue-400"
                  >
                    {fact.link.label}
                  </a>
                ) : (
                  <Link href={fact.link.href} className="font-semibold text-blue-600 dark:text-blue-400">
                    {fact.link.label}
                  </Link>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
