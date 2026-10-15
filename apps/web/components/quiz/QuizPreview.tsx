import { Lock } from "lucide-react";
import type { QuizShowResponse } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";

export default function QuizPreview({
  data,
  isExam,
  onStart,
  resume = null,
  onResume,
  disabled = false,
}: {
  data: QuizShowResponse;
  isExam: boolean;
  onStart: () => void;
  resume?: { answered: number; remainingSeconds: number | null } | null;
  onResume?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-neutral-800 p-8 text-center shadow-sm">
      {data.quiz.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.quiz.cover_image_url} alt="" className="mx-auto max-h-48 rounded-2xl object-cover" />
      )}
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{data.quiz.title}</h1>
      <Paragraph color="muted">
        {data.quiz.category?.title}
        {data.quiz.state && ` · ${data.quiz.state.name}`}
        {data.quiz.vehicle_type && ` · ${data.quiz.vehicle_type.title}`}
      </Paragraph>
      <Paragraph color="muted">
        {data.quiz.total_questions} questions
        {data.quiz.duration_seconds && ` · ${Math.round(data.quiz.duration_seconds / 60)} min`}
        {isExam && data.quiz.passing_score_percent != null && ` · pass mark ${data.quiz.passing_score_percent}%`}
      </Paragraph>
      {isExam && !data.locked && (
        <Paragraph color="muted" size="sm">
          This is a timed exam simulation. Once started, the clock cannot be paused and questions can&apos;t be
          revisited.
        </Paragraph>
      )}
      {data.locked ? (
        <div className="space-y-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-6">
          <Lock className="mx-auto h-8 w-8 text-amber-600" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">This is a premium quiz</p>
          <Paragraph color="muted" size="sm">
            Upgrade to unlock this quiz and start practicing.
          </Paragraph>
          <Button href="/pricing">View plans</Button>
        </div>
      ) : resume ? (
        <div className="space-y-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-6">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">You have an exam in progress</p>
          <Paragraph color="muted" size="sm">
            {resume.answered} of {data.quiz.total_questions} answered
            {resume.remainingSeconds != null && ` · ${formatClock(resume.remainingSeconds)} left`}
          </Paragraph>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={onResume} disabled={disabled}>
              Resume exam
            </Button>
            <Button onClick={onStart} variant="ghost" disabled={disabled}>
              Start over
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={onStart} disabled={disabled}>
          {isExam ? "Start exam" : "Start test"}
        </Button>
      )}
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(totalSeconds, 0);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
