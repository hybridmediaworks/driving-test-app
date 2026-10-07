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

/**
 * Real activity numbers from GET /states/{code}/stats — shared by every vehicle type/test track
 * combination (previously four separate components each with their own hardcoded numbers). Reads
 * small today since real traffic is low; that's the honest state of things, not a placeholder to
 * dress up with fabricated deltas or a nationwide-rank claim.
 *
 * The pass rate was the one card still showing a made-up number (a flat "95.6% with premium") beside
 * three live ones. The endpoint has carried a real `pass_rate` all along — graded attempts that
 * passed, for this state and vehicle, premium or not — so it shows that, and a dash until anything
 * has been graded, like its neighbours.
 */
export default function LiveDataSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stats = useStateStats();
  const personLabel = selectedVehicle === "Motorcycle" ? "riders" : "students";

  const sessionLength = formatSessionLength(stats?.avg_session_seconds ?? null);

  return (
    <div className="z-10 relative md:p-15 p-5 text-center space-y-12 bg-[linear-gradient(180deg,#fff_0%,#F0FDF4_100%)] dark:bg-[linear-gradient(180deg,#1a1a1a_0%,#16211b_100%)] shadow-hover max-w-container mx-auto rounded-4xl">
      <Heading as="h3" className="max-w-162 mx-auto">
        How {selectedState} students are practicing
      </Heading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            {personLabel.charAt(0).toUpperCase() + personLabel.slice(1)}{" "}
            practiced
          </Paragraph>
          <Heading as="h3" className="text-blue-500!">
            {stats ? stats.students_practiced_total.toLocaleString() : "—"}
          </Heading>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            Questions answered
          </Paragraph>
          <Heading as="h3" className="text-red-500!">
            {stats ? stats.questions_answered_total.toLocaleString() : "—"}
          </Heading>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            Average study session
          </Paragraph>
          <Heading as="h3" className="text-yellow-500!">
            {sessionLength ?? "—"}
          </Heading>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border shadow-card p-3 lg:p-8 space-y-2">
          <Paragraph size="lg" color="muted" className="leading-4!">
            Pass rate on our tests
          </Paragraph>
          <Heading as="h3" className="text-green-500!">
            {stats?.pass_rate != null ? `${stats.pass_rate}%` : "—"}
          </Heading>
        </div>
      </div>
    </div>
  );
}
