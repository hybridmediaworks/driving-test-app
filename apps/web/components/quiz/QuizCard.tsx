import Link from "next/link";
import { CheckCircle2, Clock, FileQuestion, Lock, Target } from "lucide-react";
import type { PublicQuiz } from "@driving-test-app/shared";

/** A badge with its own tone. Kept tiny — a card can carry three of these at once. */
function Pill({ tone, children }: { tone: "premium" | "exam" | "progress" | "passed"; children: React.ReactNode }) {
  const tones = {
    premium: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
    exam: "bg-blue-500/15 text-blue-900 dark:text-blue-200",
    progress: "bg-green-500/15 text-green-900 dark:text-green-200",
    passed: "bg-green-600/15 text-green-900 dark:text-green-200",
  } as const;

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/**
 * One practice test in a browse grid.
 *
 * The card lifts on hover with the shadow growing beneath it — the same treatment the dashboard
 * cards use, so a surface you can open behaves the same way everywhere in the product.
 */
export default function QuizCard({ quiz }: { quiz: PublicQuiz }) {
  const isExam = quiz.quiz_type?.name === "final";
  const image = quiz.cover_image_url ?? quiz.preview_image_url ?? null;
  const scope = [quiz.state?.name, quiz.vehicle_type?.title, quiz.category?.title].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/quizzes/${quiz.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_20px_44px_-26px_rgba(16,24,40,0.5)] focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none"
    >
      {image && (
        <div className="relative h-36 overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
          {quiz.locked && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
              <Lock aria-hidden className="size-6 text-foreground" />
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground transition-colors group-hover:text-chart-1">{quiz.title}</h3>
          {!image && quiz.locked && <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-600" />}
        </div>

        {scope && <p className="text-sm text-muted-foreground">{scope}</p>}

        <div className="flex flex-wrap items-center gap-1.5">
          {quiz.is_premium && <Pill tone="premium">Premium</Pill>}
          {isExam && <Pill tone="exam">Exam simulation</Pill>}
          {quiz.in_progress && !quiz.locked && (
            <Pill tone="progress">
              Continue {quiz.in_progress.answered}/{quiz.in_progress.total}
            </Pill>
          )}
          {quiz.user_passed === true && (
            <Pill tone="passed">
              <CheckCircle2 aria-hidden className="size-3" />
              Passed
            </Pill>
          )}
        </div>

        {/* How far through a resumable attempt is — the one number a returning learner looks for. */}
        {quiz.in_progress && !quiz.locked && quiz.in_progress.total > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-green-600 transition-[width] duration-500"
              style={{ width: `${(quiz.in_progress.answered / quiz.in_progress.total) * 100}%` }}
            />
          </div>
        )}

        <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileQuestion aria-hidden className="size-3.5" />
            <dt className="sr-only">Questions</dt>
            <dd className="tabular-nums">{quiz.total_questions}</dd>
          </div>
          {quiz.duration_seconds != null && (
            <div className="flex items-center gap-1.5">
              <Clock aria-hidden className="size-3.5" />
              <dt className="sr-only">Time limit</dt>
              <dd className="tabular-nums">{Math.round(quiz.duration_seconds / 60)} min</dd>
            </div>
          )}
          {isExam && quiz.passing_score_percent != null && (
            <div className="flex items-center gap-1.5">
              <Target aria-hidden className="size-3.5" />
              <dt className="sr-only">Pass mark</dt>
              <dd className="tabular-nums">{quiz.passing_score_percent}%</dd>
            </div>
          )}
          <div className="ml-auto">
            <dt className="sr-only">Test track</dt>
            <dd>{quiz.test_track === "permit_test" ? "Permit Test" : "Driving Test"}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
