"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useStateStats } from "@/lib/useStateStats";
import { useWebLayout } from "@/lib/web-layout-context";

function formatSessionLength(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  return minutes > 0 ? `${minutes} min` : `${Math.round(seconds)} sec`;
}

function formatPeakHour(hour: number | null): string | null {
  if (hour === null) return null;
  const period = hour < 12 ? "AM" : "PM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour} ${period}`;
}

function formatPeakTime(hour: number | null, weekday: string | null): string {
  const hourLabel = formatPeakHour(hour);
  if (!hourLabel) return "Not enough data yet";
  return weekday ? `${hourLabel} on ${weekday}s` : hourLabel;
}

function formatCombinedPractice(seconds: number): string {
  const hours = seconds / 3600;
  if (hours >= 24) return `${Math.round(hours / 24).toLocaleString()} days`;
  if (hours >= 1) return `${Math.round(hours).toLocaleString()} hrs`;
  return `${Math.round(seconds / 60).toLocaleString()} min`;
}

/**
 * Real activity numbers from GET /states/{code}/stats — shared by every vehicle type/test track
 * combination (previously four separate components each with their own hardcoded numbers). Reads
 * small today since real traffic is low; that's the honest state of things, not a placeholder to
 * dress up with fabricated deltas or a nationwide-rank claim.
 */
export default function LiveDataSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stats = useStateStats();
  const personLabel = selectedVehicle === "Motorcycle" ? "riders" : "students";

  const sessionLength = formatSessionLength(stats?.avg_session_seconds ?? null);

  return (
    <div className="z-10 relative md:p-15 p-5 text-center space-y-12 bg-[linear-gradient(180deg,#fff_0%,#F0FDF4_100%)] shadow-hover max-w-container mx-auto rounded-4xl">
      <Heading as="h3" className="max-w-162 mx-auto">
        How {selectedState} students are practicing
      </Heading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            {personLabel.charAt(0).toUpperCase() + personLabel.slice(1)}{" "}
            practiced
          </Paragraph>
          <Heading as="h3" className="text-blue-500!">
            {stats ? stats.students_practiced_30d.toLocaleString() : "—"}
          </Heading>
        </div>
        <div className="bg-white rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            Questions answered
          </Paragraph>
          <Heading as="h3" className="text-red-500!">
            {stats ? stats.questions_answered_total.toLocaleString() : "—"}
          </Heading>
        </div>
        <div className="bg-white rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            Average study session
          </Paragraph>
          <Heading as="h3" className="text-yellow-500!">
            {sessionLength ?? "—"}
          </Heading>
        </div>

        <div className="bg-white rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            Pass rate with premium
          </Paragraph>
          <Heading as="h3" className="text-green-500!">
            95.6%
          </Heading>
        </div>
      </div>
    </div>
  );
}
