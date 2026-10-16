"use client";

import { Diamond, Eye, Gauge, Shield, Signpost, SquareParking, TrafficCone, Wine, type LucideIcon } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useStateStats } from "@/lib/useStateStats";
import { useWebLayout } from "@/lib/web-layout-context";

function formatSessionLength(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  return minutes > 0 ? `${minutes} min` : `${Math.round(seconds)} sec`;
}

type Topic ={ title: string; description: string; icon: LucideIcon; tone: string };

const PERMIT_TOPICS: Topic[] = [
  {
    title: "Traffic laws",
    description: "Right of way, speed limits and the rules of the road.",
    icon: Signpost,
    tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    title: "Safe-driving practices",
    description: "Following distance, lane use and sharing the road.",
    icon: Shield,
    tone: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  },
  {
    title: "Road signs",
    description: "Shapes, colors and what each sign asks you to do.",
    icon: Diamond,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    title: "Alcohol awareness",
    description: "Limits, penalties and how impairment affects driving.",
    icon: Wine,
    tone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  },
];

const DRIVING_TOPICS: Topic[] = [
  {
    title: "Vehicle control",
    description: "Smooth starts, steady speed and confident braking.",
    icon: Gauge,
    tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    title: "Observation",
    description: "Mirrors, blind spots and spotting hazards early.",
    icon: Eye,
    tone: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  },
  {
    title: "Intersections",
    description: "Right of way, signals and full, legal stops.",
    icon: TrafficCone,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    title: "Maneuvers",
    description: "Parking, backing up and three-point turns.",
    icon: SquareParking,
    tone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  },
];

export default function EverythingYouNeedSection({ track = "permit" }: { track?: "permit" | "driving" }) {
  const isDriving = track === "driving";
  const topics = isDriving ? DRIVING_TOPICS : PERMIT_TOPICS;
  const { selectedState, selectedVehicle } = useWebLayout();
  const stats = useStateStats();
  const personLabel = selectedVehicle === "Motorcycle" ? "Riders" : "Students";

  const sessionLength = formatSessionLength(stats?.avg_session_seconds ?? null);

  const figures = [
    {
      value: stats ? stats.students_practiced_total.toLocaleString() : "—",
      label: `${personLabel} practiced`,
      tone: "text-blue-500",
    },
    {
      value: stats ? stats.questions_answered_total.toLocaleString() : "—",
      label: "Questions answered",
      tone: "text-red-500",
    },
    {
      value: sessionLength ?? "—",
      label: "Average study session",
      tone: "text-yellow-500",
    },
    {
      value: stats?.pass_rate != null ? `${stats.pass_rate}%` : "—",
      label: "Pass rate on our tests",
      tone: "text-green-500",
    },
  ];

  return (
    <section className={`bg-background2 px-5 pt-15 lg:pt-28 ${isDriving ? "pb-15 lg:pb-28" : ""}`}>
      <div className="mx-auto max-w-container">
        <div className="mx-auto max-w-225 text-center">
          <Heading size="md" weight="bold">
            Everything you need to pass the <br className="hidden md:inline" />
            {selectedState} {isDriving ? "driving" : "permit"} test, in one place
          </Heading>
          <Paragraph size="lg" color="muted" className="mx-auto mt-4 max-w-145">
            {isDriving
              ? "The road test checks four skills. Our simulators and videos mirror what examiners look for, so there are no surprises on test day."
              : "The written test covers four areas. Our questions mirror the official exam, so there are no surprises on test day."}
          </Paragraph>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map(({ title, description, icon: Icon, tone }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-white dark:bg-neutral-800 p-6 shadow-xs"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-sora text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)] rounded-3xl border border-border bg-white dark:bg-neutral-800 shadow-xs">
          <div className="col-span-2 lg:col-span-1 border-b lg:border-b-0 border-border p-6 lg:px-7 lg:py-8">
            <p className="font-bold leading-snug text-neutral-900 dark:text-neutral-100">
              How {selectedState} {personLabel.toLowerCase()} are practicing
            </p>
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              Across all our {selectedState} tests
            </p>
          </div>
          {figures.map(({ value, label, tone }, index) => (
            <div
              key={label}
              className={`border-border p-6 lg:px-7 lg:py-8 lg:border-l ${index % 2 === 1 ? "border-l" : ""} ${index < 2 ? "border-b lg:border-b-0" : ""}`}
            >
              <p className={`font-sora text-2xl md:text-[28px] font-semibold leading-none ${tone}`}>{value}</p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
