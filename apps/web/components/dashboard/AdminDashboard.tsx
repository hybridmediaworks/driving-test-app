"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import type { AdminStats } from "@driving-test-app/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import AnimatedNumber from "./AnimatedNumber";
import BarBreakdown from "./BarBreakdown";
import HeroStat from "./HeroStat";
import StateActivityChart from "./StateActivityChart";
import StatusPill from "./StatusPill";

const CLAIM_STATUS_TONE = {
  approved: "good",
  under_review: "warning",
  submitted: "warning",
  denied: "critical",
  refunded: "neutral",
} as const;

const CLAIM_STATUS_LABEL: Record<
  keyof AdminStats["billing"]["claims"],
  string
> = {
  approved: "Approved",
  under_review: "Under review",
  submitted: "Submitted",
  denied: "Denied",
  refunded: "Refunded",
};

/**
 * The lift every card shares on hover: a small rise with the shadow growing beneath it, so the
 * surface reads as something you can pick up. Kept in one place because a dashboard where cards
 * lift by slightly different amounts looks broken rather than lively.
 */
const CARD_HOVER =
  "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_20px_44px_-26px_rgba(16,24,40,0.5)]";

/** Vehicle types take categorical slots in the order the server ranks them, never cycled. */
const VEHICLE_COLORS = ["#007aff", "#eb6834", "#1baf7a", "#eda100"];

function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

/**
 * A figure in the rail beside the headline. Smaller type, same surface: the hierarchy is carried
 * by scale alone, which is what four equally-weighted cards could never do.
 */
function RailStat({
  label,
  value,
  sublabel,
  href,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  /** Where this figure can be looked into. Hover means "there is more here", so it is only
      offered on cards that actually lead somewhere. */
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`flex-1 rounded-xl border border-border bg-card p-5 focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none ${CARD_HOVER}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-overpass text-3xl font-bold tabular-nums">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </Link>
  );
}

/** Mirrors the real layout so the page does not jump when the numbers land. */
function DashboardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-4"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-[320px] rounded-xl border border-border bg-muted/40" />
        <div className="flex flex-col gap-4">
          <div className="h-[98px] rounded-xl border border-border bg-muted/40" />
          <div className="h-[98px] rounded-xl border border-border bg-muted/40" />
          <div className="h-[98px] rounded-xl border border-border bg-muted/40" />
        </div>
      </div>
      <div className="h-[460px] rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats").then(setStats);
  }, []);

  if (!stats) return <DashboardSkeleton />;

  const totalLibraryItems =
    stats.content.flashcards.total + stats.content.cheat_sheets.total;
  const totalPremiumItems =
    stats.content.flashcards.premium + stats.content.cheat_sheets.premium;
  const verifiedRate =
    stats.users.total > 0
      ? Math.round((stats.users.verified / stats.users.total) * 100)
      : 0;
  const totalSubscribers =
    stats.billing.active_weekly_subscribers +
    stats.billing.active_monthly_subscribers;
  const totalClaims = Object.values(stats.billing.claims).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    // One quiet fade for the page; the orchestrated moment belongs to the headline figure counting
    // up and the chart drawing itself, not to every card sliding into place in turn.
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <HeroStat
          className={CARD_HOVER}
          label="Questions in the library"
          value={stats.quizzes.questions}
          sublabel={`Across ${stats.quizzes.total.toLocaleString()} tests in ${stats.content.states} states`}
          segments={stats.content.questions_by_vehicle.map((row, index) => ({
            label: row.name,
            value: row.questions,
            color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
          }))}
          figures={[
            {
              label: "Answer options",
              value: stats.quizzes.answers,
              href: "/admin/quizzes",
            },
            {
              label: "Flashcards",
              value: stats.content.flashcards.total,
              href: "/admin/flashcards",
            },
            {
              label: "Videos",
              value: stats.content.videos,
              href: "/admin/videos",
            },
            {
              label: "Hazard simulators",
              value: stats.content.hazard_simulators,
              href: "/admin/hazard-simulators",
            },
          ]}
        />

        <div className="flex flex-col gap-4">
          <RailStat
            label="Tests taken today"
            href="/admin/attempts"
            value={stats.attempts.today}
            sublabel={`${stats.attempts.last_7_days.toLocaleString()} this week · ${stats.attempts.total.toLocaleString()} all time`}
          />
          <RailStat
            label="New users today"
            href="/admin/user-management"
            value={stats.users.new_today}
            sublabel={`${stats.users.new_last_7_days} this week · ${stats.users.total.toLocaleString()} all time`}
          />
          <RailStat
            label="Recurring revenue"
            href="/admin/plans"
            value={`${formatCents(stats.billing.recurring_revenue_cents)}/mo`}
            sublabel={`${totalSubscribers.toLocaleString()} subscribers · ${stats.billing.active_family_groups} family groups`}
          />
        </div>
      </div>

      <Card className={CARD_HOVER}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Where tests are being taken
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            The five busiest states over the last seven days
          </p>
        </CardHeader>
        <CardContent>
          <StateActivityChart data={stats.activity.top_states_last_7_days} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className={CARD_HOVER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Content library
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalLibraryItems.toLocaleString()} items ·{" "}
              {totalPremiumItems.toLocaleString()} premium
            </p>
          </CardHeader>
          <CardContent>
            <BarBreakdown
              rows={[
                {
                  label: "Quizzes",
                  value: stats.quizzes.total,
                  color: "#007aff",
                },
                {
                  label: "Flashcards",
                  value: stats.content.flashcards.total,
                  color: "#eb6834",
                },
                {
                  label: "Cheat sheets",
                  value: stats.content.cheat_sheets.total,
                  color: "#1baf7a",
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card className={CARD_HOVER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              How attempts end
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Average score {stats.attempts.average_score ?? "—"}%
            </p>
          </CardHeader>
          <CardContent>
            <BarBreakdown
              rows={[
                {
                  label: "Completed",
                  value: stats.attempts.completed,
                  color: "#1baf7a",
                },
                {
                  label: "In progress",
                  value: stats.attempts.in_progress,
                  color: "#eda100",
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card className={CARD_HOVER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Learners</CardTitle>
            <p className="text-xs text-muted-foreground">
              {verifiedRate}% have verified their email
            </p>
          </CardHeader>
          <CardContent>
            <BarBreakdown
              rows={[
                {
                  label: "Verified",
                  value: stats.users.verified,
                  color: "#1baf7a",
                },
                {
                  label: "Unverified",
                  value: stats.users.total - stats.users.verified,
                  color: "#e87ba4",
                },
                {
                  label: "Flashcard reviews",
                  value: stats.content.flashcards.reviews,
                  color: "#4a3aa7",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card className={CARD_HOVER}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Pass Guarantee claims
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {totalClaims} in total
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead />
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(
                Object.keys(
                  stats.billing.claims,
                ) as (keyof AdminStats["billing"]["claims"])[]
              ).map((status) => (
                <TableRow key={status}>
                  <TableCell>{CLAIM_STATUS_LABEL[status]}</TableCell>
                  <TableCell>
                    <StatusPill tone={CLAIM_STATUS_TONE[status]}>
                      {status === "approved" ||
                      status === "denied" ||
                      status === "refunded"
                        ? "Resolved"
                        : "Pending"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {stats.billing.claims[status]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
