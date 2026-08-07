"use client";

import { Clock, TrendingUp, Users } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
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
  const peakHour = formatPeakHour(stats?.peak_hour ?? null);

  return (
    <section className="px-5 pt-15 pb-15 lg:pt-30 lg:pb-15">
      <div className="mx-auto max-w-container space-y-5.5">
        <div className="max-w-170 space-y-4">
          <Subheading text="Live Data" />
          <Heading as="h2">
            How {selectedState} {personLabel} are practicing
          </Heading>
          <Paragraph>
            A live snapshot of {selectedState} learners on DriveLane over the last 30 days.
          </Paragraph>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white p-6 border rounded-xl space-y-3">
            <Paragraph className="font-medium flex items-center gap-1.5">
              <Users className="w-4 h-4 text-neutral-400" />
              {personLabel.charAt(0).toUpperCase() + personLabel.slice(1)} practiced
            </Paragraph>
            <Heading size="lg">{stats ? stats.students_practiced_30d.toLocaleString() : "—"}</Heading>
            <Paragraph size="sm" color="muted">
              Active today: {stats ? stats.active_today.toLocaleString() : "—"}
            </Paragraph>
          </div>
          <div className="bg-white p-6 border rounded-xl space-y-3">
            <Paragraph className="font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-neutral-400" />
              Questions answered
            </Paragraph>
            <Heading size="lg">{stats ? stats.questions_answered_total.toLocaleString() : "—"}</Heading>
            <Paragraph size="sm" color="muted">
              Last 30 days
            </Paragraph>
          </div>
          <div className="bg-white p-6 border rounded-xl space-y-3">
            <Paragraph className="font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-400" />
              Avg. session length
            </Paragraph>
            <Heading size="lg">{sessionLength ?? "—"}</Heading>
            <Paragraph size="sm" color="muted">
              {peakHour ? `Peak practice time: ${peakHour}` : "Not enough data yet"}
            </Paragraph>
          </div>
        </div>
      </div>
    </section>
  );
}
