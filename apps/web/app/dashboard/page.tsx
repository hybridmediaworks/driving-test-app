"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminStats, UserStats } from "@driving-test-app/shared";
import AppLayout from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <StatCard title="Flashcards" value={stats.content.flashcards.total} hint={`${stats.content.flashcards.active} active · ${stats.content.flashcards.premium} premium`} />
      <StatCard title="Flashcard reviews" value={stats.content.flashcards.reviews} hint="recorded by users" />
      <StatCard title="Cheat sheets" value={stats.content.cheat_sheets.total} hint={`${stats.content.cheat_sheets.active} active · ${stats.content.cheat_sheets.premium} premium`} />
    </div>
  );
}

function UserDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    api.get<UserStats>("/me/stats").then(setStats);
  }, []);

  if (!stats) {
    return <div className="p-4 text-sm text-muted-foreground">Loading stats…</div>;
  }

  const passRate = stats.attempts.completed > 0 ? Math.round((stats.attempts.passed / stats.attempts.completed) * 100) : null;
  const flashcardsReviewed = stats.flashcards.known + stats.flashcards.unknown;

  return (
    <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Quiz attempts" value={stats.attempts.total} hint={`${stats.attempts.completed} completed`} />
      <StatCard title="Average score" value={stats.attempts.average_score ?? "—"} />
      <StatCard title="Tests passed" value={stats.attempts.passed} hint={passRate === null ? "no completed attempts yet" : `${passRate}% pass rate`} />
      <StatCard
        title="Flashcards known"
        value={stats.flashcards.known}
        hint={`${stats.flashcards.unknown} to review · ${flashcardsReviewed}/${stats.flashcards.total_active} studied`}
      />
      <StatCard title="Cheat sheets available" value={stats.cheat_sheets.total_active} />
      {stats.attempts.total === 0 && (
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardContent className="text-sm text-muted-foreground">
            You haven&apos;t taken a quiz yet. <Link href="/quizzes" className="underline">Start a practice test</Link> to see your
            stats here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }]}>
      <div className="app-page flex h-full min-h-0 flex-1 flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {user?.is_admin ? <AdminDashboard /> : <UserDashboard />}
      </div>
    </AppLayout>
  );
}
