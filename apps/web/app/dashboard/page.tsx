"use client";

import { useEffect, useState } from "react";
import type { AdminStats } from "@driving-test-app/shared";
import AppLayout from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlaceholderPattern from "@/components/ui/PlaceholderPattern";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function StatCard({ title, value, hint }: { title: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats").then(setStats);
  }, []);

  if (!stats) {
    return <div className="p-4 text-sm text-muted-foreground">Loading stats…</div>;
  }

  return (
    <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Total users" value={stats.users.total} hint={`${stats.users.new_last_7_days} new in the last 7 days`} />
      <StatCard title="Admins" value={stats.users.admins} />
      <StatCard title="Verified users" value={stats.users.verified} />
      <StatCard title="Quizzes" value={stats.quizzes.total} hint={`${stats.quizzes.active} active`} />
      <StatCard title="Quiz categories" value={stats.quizzes.categories} />
      <StatCard title="Questions" value={stats.quizzes.questions} />
      <StatCard title="Quiz attempts" value={stats.attempts.total} hint={`${stats.attempts.last_7_days} in the last 7 days`} />
      <StatCard title="Completed attempts" value={stats.attempts.completed} hint={`${stats.attempts.in_progress} in progress`} />
      <StatCard title="Average score" value={stats.attempts.average_score ?? "—"} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }]}>
      <div className="app-page flex h-full min-h-0 flex-1 flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {user?.is_admin ? (
          <AdminDashboard />
        ) : (
          <>
            <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
                <PlaceholderPattern />
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
                <PlaceholderPattern />
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
                <PlaceholderPattern />
              </div>
            </div>
            <div className="relative min-h-[36vh] flex-1 rounded-xl border border-sidebar-border/70 md:min-h-[20rem]">
              <PlaceholderPattern />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
