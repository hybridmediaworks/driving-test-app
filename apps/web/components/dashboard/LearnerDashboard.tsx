"use client";

import { ClipboardList, Copy, NotebookText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { QuizAttempt, UserStats } from "@driving-test-app/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AnimatedNumber from "./AnimatedNumber";
import HorizontalBars from "./HorizontalBars";
import ScoreTrendChart from "./ScoreTrendChart";
import StackedBar from "./StackedBar";
import StatusPill from "./StatusPill";

/** The same lift the admin dashboard uses, so both pages feel like one product. */
const CARD_HOVER =
  "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_20px_44px_-26px_rgba(16,24,40,0.5)]";

const QUICK_ACTIONS = [
  { title: "Take a practice test", href: "/quizzes", icon: ClipboardList },
  { title: "Study flashcards", href: "/flashcards/study", icon: Copy },
  { title: "Browse cheat sheets", href: "/cheat-sheets", icon: NotebookText },
];

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  // No pagination UI here (fixed-size recent-activity list) — always page 1.
  const { data: recentAttempts } = usePaginatedList<QuizAttempt>(
    "/attempts?per_page=5",
    1,
  );

  useEffect(() => {
    api.get<UserStats>("/me/stats").then(setStats);
  }, []);

  if (!stats) {
    return (
      <div
        className="flex animate-pulse flex-col gap-4"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-[300px] rounded-xl border border-border bg-muted/40" />
          <div className="flex flex-col gap-4">
            <div className="h-[142px] rounded-xl border border-border bg-muted/40" />
            <div className="h-[142px] rounded-xl border border-border bg-muted/40" />
          </div>
        </div>
        <div className="h-[280px] rounded-xl border border-border bg-muted/40" />
      </div>
    );
  }

  const passRate =
    stats.attempts.completed > 0
      ? Math.round((stats.attempts.passed / stats.attempts.completed) * 100)
      : null;
  const notStarted = Math.max(
    stats.flashcards.total_active -
      stats.flashcards.known -
      stats.flashcards.unknown,
    0,
  );
  const weakestCategory =
    stats.categories.length > 0
      ? stats.categories.reduce((min, c) =>
          c.average_score < min.average_score ? c : min,
        )
      : null;
  const firstName = user?.name?.split(" ")[0];
  // Cards they have actually touched. The old headline read "0 / 59,138" — the denominator being
  // every card in the catalogue, across every state and vehicle, which nobody will ever finish.
  // A number that can only ever look like failure is not progress.
  const cardsStudied = stats.flashcards.known + stats.flashcards.unknown;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* What they came to do, not how they last did. A learner opening this page on their first
            morning used to meet a 0% pass-rate ring — true, useless, and discouraging. The score
            still shows, in the rail, where it informs without greeting them with a failure. */}
        <div
          className={`flex flex-col justify-between gap-6 rounded-xl border border-border bg-card p-6 sm:p-8 ${CARD_HOVER}`}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.attempts.completed === 0
                ? "Take your first practice test to see where you stand."
                : `${stats.attempts.completed} practice test${stats.attempts.completed === 1 ? "" : "s"} done so far.`}
            </p>
          </div>

          <div>
            <p className="font-overpass text-[clamp(2.5rem,5vw,3.75rem)] leading-none font-bold tabular-nums">
              <AnimatedNumber value={stats.attempts.completed} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Practice tests completed
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="-m-1 flex items-center gap-2 rounded-lg p-1 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none"
              >
                <action.icon className="size-4 shrink-0 text-chart-1" />
                {action.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className={`flex-1 rounded-xl border border-border bg-card p-5 ${CARD_HOVER}`}
          >
            <p className="text-sm text-muted-foreground">Average score</p>
            <p className="mt-2 font-overpass text-3xl font-bold tabular-nums">
              {stats.attempts.average_score !== null
                ? `${Math.round(stats.attempts.average_score)}%`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {passRate === null
                ? "Complete a test to see your pass rate"
                : `${passRate}% pass rate · ${stats.attempts.passed} of ${stats.attempts.completed} passed`}
            </p>
          </div>

          <div
            className={`flex-1 rounded-xl border border-border bg-card p-5 ${CARD_HOVER}`}
          >
            <p className="text-sm text-muted-foreground">Flashcards studied</p>
            <p className="mt-2 font-overpass text-3xl font-bold tabular-nums">
              <AnimatedNumber value={cardsStudied} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.flashcards.known.toLocaleString()} known ·{" "}
              {stats.flashcards.unknown.toLocaleString()} still learning
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className={CARD_HOVER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Score trend</CardTitle>
            <p className="text-xs text-muted-foreground">
              Last {stats.attempts.recent_scores.length} completed attempts
            </p>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart scores={stats.attempts.recent_scores} />
          </CardContent>
        </Card>

        <Card className={CARD_HOVER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Flashcard progress
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {stats.flashcards.total_active.toLocaleString()} cards in your
              library
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <StackedBar
              total={stats.flashcards.total_active}
              segments={[
                {
                  value: stats.flashcards.known,
                  label: "Known",
                  colorClassName: "bg-status-good",
                },
                {
                  value: stats.flashcards.unknown,
                  label: "Still learning",
                  colorClassName: "bg-status-warning",
                },
                {
                  value: notStarted,
                  label: "Not started",
                  colorClassName: "bg-border",
                  textClassName: "text-muted-foreground",
                },
              ]}
            />
            <p className="border-t border-border pt-3.5 text-[12.5px] text-muted-foreground">
              {stats.cheat_sheets.total_active.toLocaleString()} cheat sheets
              available in your library
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.categories.length > 0 && (
        <Card className={CARD_HOVER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Performance by category
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Average score across your completed attempts
            </p>
          </CardHeader>
          <CardContent>
            <HorizontalBars
              max={100}
              valueSuffix="%"
              rows={stats.categories.map((category) => ({
                label: category.name,
                value: Math.round(category.average_score),
                flag:
                  weakestCategory?.id === category.id &&
                  stats.categories.length > 1
                    ? "Focus here"
                    : undefined,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        <Card className={CARD_HOVER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!recentAttempts || recentAttempts.data.length === 0 ? (
              <p className="px-(--card-spacing) pb-1 text-sm text-muted-foreground">
                No attempts yet.{" "}
                <Link href="/quizzes" className="underline">
                  Take a practice test
                </Link>{" "}
                to get started.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentAttempts.data.map((attempt) => (
                  <li
                    key={attempt.id}
                    className="flex items-center gap-3 px-(--card-spacing) py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {attempt.quiz?.title ?? `Quiz #${attempt.quiz_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.completed_at &&
                          new Date(
                            attempt.completed_at,
                          ).toLocaleDateString()}{" "}
                        · {attempt.correct_count}/{attempt.total_questions}{" "}
                        correct
                      </p>
                    </div>
                    <StatusPill
                      tone={
                        attempt.passed === true
                          ? "good"
                          : attempt.passed === false
                            ? "critical"
                            : "neutral"
                      }
                    >
                      {attempt.passed === true
                        ? "Passed"
                        : attempt.passed === false
                          ? "Not passed"
                          : "Completed"}
                    </StatusPill>
                    <span className="w-11 text-right text-[13px] font-bold tabular-nums">
                      {Math.round(attempt.score)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
