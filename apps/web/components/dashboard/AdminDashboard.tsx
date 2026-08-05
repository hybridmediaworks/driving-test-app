"use client";

import { useEffect, useState } from "react";
import type { AdminStats } from "@driving-test-app/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import HorizontalBars from "./HorizontalBars";
import Sparkline from "./Sparkline";
import StackedBar from "./StackedBar";
import StatCard from "./StatCard";
import StatusPill from "./StatusPill";

const CLAIM_STATUS_TONE = {
  approved: "good",
  under_review: "warning",
  submitted: "warning",
  denied: "critical",
  refunded: "neutral",
} as const;

const CLAIM_STATUS_LABEL: Record<keyof AdminStats["billing"]["claims"], string> = {
  approved: "Approved",
  under_review: "Under review",
  submitted: "Submitted",
  denied: "Denied",
  refunded: "Refunded",
};

function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats").then(setStats);
  }, []);

  if (!stats) {
    return <div className="p-4 text-sm text-muted-foreground">Loading stats…</div>;
  }

  const contentMax = Math.max(stats.quizzes.total, stats.content.flashcards.total, stats.content.cheat_sheets.total);
  const totalLibraryItems = stats.content.flashcards.total + stats.content.cheat_sheets.total;
  const totalPremiumItems = stats.content.flashcards.premium + stats.content.cheat_sheets.premium;
  const verifiedRate = stats.users.total > 0 ? Math.round((stats.users.verified / stats.users.total) * 100) : 0;
  const totalSubscribers = stats.billing.active_weekly_subscribers + stats.billing.active_monthly_subscribers;
  const totalClaims = Object.values(stats.billing.claims).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total users" value={stats.users.total.toLocaleString()} delta={`+${stats.users.new_last_7_days} / 7d`}>
          <Sparkline data={stats.users.daily_new_last_7_days} />
        </StatCard>
        <StatCard title="Quiz attempts" value={stats.attempts.total.toLocaleString()} delta={`+${stats.attempts.last_7_days} / 7d`}>
          <Sparkline data={stats.attempts.daily_last_7_days} />
        </StatCard>
        <StatCard title="Average score" value={stats.attempts.average_score !== null ? `${stats.attempts.average_score}%` : "—"} />
        <StatCard
          title="Content library"
          value={`${totalLibraryItems.toLocaleString()} items`}
          hint={`${totalPremiumItems} premium`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Content added by type</CardTitle>
            <p className="text-xs text-muted-foreground">Total items live today</p>
          </CardHeader>
          <CardContent>
            <HorizontalBars
              max={contentMax}
              rows={[
                { label: "Quizzes", value: stats.quizzes.total, colorClassName: "bg-chart-1" },
                { label: "Flashcards", value: stats.content.flashcards.total, colorClassName: "bg-chart-2" },
                { label: "Cheat Sheets", value: stats.content.cheat_sheets.total, colorClassName: "bg-chart-3" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Attempt status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <StackedBar
              total={stats.attempts.total}
              segments={[
                { value: stats.attempts.completed, label: "Completed", colorClassName: "bg-chart-1" },
                { value: stats.attempts.in_progress, label: "In progress", colorClassName: "bg-border", textClassName: "text-muted-foreground" },
              ]}
            />
            <p className="border-t border-border pt-3.5 text-[12.5px] text-muted-foreground">
              {stats.content.flashcards.reviews.toLocaleString()} flashcard reviews recorded across all users
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Pass Guarantee claims</CardTitle>
          <p className="text-xs text-muted-foreground">{totalClaims} total claims</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(stats.billing.claims) as (keyof AdminStats["billing"]["claims"])[]).map((status) => (
                <TableRow key={status}>
                  <TableCell>{CLAIM_STATUS_LABEL[status]}</TableCell>
                  <TableCell>
                    <StatusPill tone={CLAIM_STATUS_TONE[status]}>
                      {status === "approved" || status === "denied" || status === "refunded" ? "Resolved" : "Pending"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{stats.billing.claims[status]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Verified users" value={`${verifiedRate}%`} />
        <StatCard title="Active family groups" value={stats.billing.active_family_groups} />
        <StatCard title="Weekly + monthly subscribers" value={totalSubscribers.toLocaleString()} />
        <StatCard title="Recurring revenue" value={`${formatCents(stats.billing.recurring_revenue_cents)}/mo`} />
      </div>
    </div>
  );
}
