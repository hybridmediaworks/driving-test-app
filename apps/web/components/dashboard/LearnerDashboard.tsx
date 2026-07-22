"use client";

import { ClipboardList, Copy, NotebookText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { QuizAttempt, UserStats } from "@driving-test-app/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import HorizontalBars from "./HorizontalBars";
import RadialMeter from "./RadialMeter";
import ScoreTrendChart from "./ScoreTrendChart";
import StackedBar from "./StackedBar";
import StatCard from "./StatCard";
import StatusPill from "./StatusPill";

const QUICK_ACTIONS = [
  { title: "Take a practice test", href: "/quizzes", icon: ClipboardList },
  { title: "Study flashcards", href: "/flashcards/study", icon: Copy },
  { title: "Browse cheat sheets", href: "/cheat-sheets", icon: NotebookText },
];

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const { data: recentAttempts } = usePaginatedList<QuizAttempt>("/attempts?per_page=5");

  useEffect(() => {
    api.get<UserStats>("/me/stats").then(setStats);
  }, []);

  if (!stats) {
    return <div className="p-4 text-sm text-muted-foreground">Loading stats…</div>;
  }

  const passRate = stats.attempts.completed > 0 ? Math.round((stats.attempts.passed / stats.attempts.completed) * 100) : null;
  const notStarted = Math.max(stats.flashcards.total_active - stats.flashcards.known - stats.flashcards.unknown, 0);
  const weakestCategory =
    stats.categories.length > 0 ? stats.categories.reduce((min, c) => (c.average_score < min.average_score ? c : min)) : null;
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <Card className="flex flex-col items-center justify-center gap-2.5 text-center">
          {passRate === null ? (
            <div className="p-4 text-sm text-muted-foreground">
              Complete a practice test to see your pass rate here.
            </div>
          ) : (
            <>
              <RadialMeter percent={passRate} centerValue={`${passRate}%`} centerCaption="pass rate" />
              <p className="text-[12.5px] text-muted-foreground">
                {stats.attempts.passed} of {stats.attempts.completed} completed tests passed
              </p>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-3.5">
          <div>
            <h1 className="text-[19px] font-bold tracking-tight">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {stats.attempts.total === 0
                ? "Take your first practice test to start building your stats."
                : `You've completed ${stats.attempts.completed} practice test${stats.attempts.completed === 1 ? "" : "s"} so far.`}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <StatCard title="Quizzes taken" value={stats.attempts.total} hint={`${stats.attempts.completed} completed`} />
            <StatCard title="Average score" value={stats.attempts.average_score !== null ? `${Math.round(stats.attempts.average_score)}%` : "—"} />
            <StatCard title="Flashcards mastered" value={`${stats.flashcards.known} / ${stats.flashcards.total_active}`}>
              <div className="h-1.5 overflow-hidden rounded-full bg-chart-track">
                <div
                  className="h-full rounded-full bg-chart-1"
                  style={{ width: `${stats.flashcards.total_active > 0 ? (stats.flashcards.known / stats.flashcards.total_active) * 100 : 0}%` }}
                />
              </div>
            </StatCard>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Score trend</CardTitle>
            <p className="text-xs text-muted-foreground">Last {stats.attempts.recent_scores.length} completed attempts</p>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart scores={stats.attempts.recent_scores} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Flashcard progress</CardTitle>
            <p className="text-xs text-muted-foreground">{stats.flashcards.total_active} cards in your library</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <StackedBar
              total={stats.flashcards.total_active}
              segments={[
                { value: stats.flashcards.known, label: "Known", colorClassName: "bg-status-good" },
                { value: stats.flashcards.unknown, label: "Still learning", colorClassName: "bg-status-warning" },
                { value: notStarted, label: "Not started", colorClassName: "bg-border", textClassName: "text-muted-foreground" },
              ]}
            />
            <p className="border-t border-border pt-3.5 text-[12.5px] text-muted-foreground">
              {stats.cheat_sheets.total_active} cheat sheets available in your library
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Performance by category</CardTitle>
            <p className="text-xs text-muted-foreground">Average score across your completed attempts</p>
          </CardHeader>
          <CardContent>
            <HorizontalBars
              max={100}
              valueSuffix="%"
              rows={stats.categories.map((category) => ({
                label: category.name,
                value: Math.round(category.average_score),
                flag: weakestCategory?.id === category.id && stats.categories.length > 1 ? "Focus here" : undefined,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!recentAttempts || recentAttempts.data.length === 0 ? (
              <p className="px-(--card-spacing) pb-1 text-sm text-muted-foreground">
                No attempts yet. <Link href="/quizzes" className="underline">Take a practice test</Link> to get started.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentAttempts.data.map((attempt) => (
                  <li key={attempt.id} className="flex items-center gap-3 px-(--card-spacing) py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{attempt.quiz?.title ?? `Quiz #${attempt.quiz_id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.completed_at && new Date(attempt.completed_at).toLocaleDateString()} · {attempt.correct_count}/{attempt.total_questions} correct
                      </p>
                    </div>
                    <StatusPill tone={attempt.passed === true ? "good" : attempt.passed === false ? "critical" : "neutral"}>
                      {attempt.passed === true ? "Passed" : attempt.passed === false ? "Not passed" : "Completed"}
                    </StatusPill>
                    <span className="w-11 text-right text-[13px] font-bold tabular-nums">{Math.round(attempt.score)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Continue</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-[13px] font-medium hover:bg-muted"
              >
                <action.icon className="size-4 text-chart-1" />
                {action.title}
                <span className="ml-auto text-muted-foreground">→</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
