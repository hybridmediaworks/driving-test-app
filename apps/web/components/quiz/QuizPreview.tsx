import { Lock } from "lucide-react";
import type { QuizShowResponse } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";

export default function QuizPreview({
  data,
  isExam,
  onStart,
}: {
  data: QuizShowResponse;
  isExam: boolean;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
      {data.quiz.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.quiz.cover_image_url} alt="" className="mx-auto max-h-48 rounded-2xl object-cover" />
      )}
      <h1 className="text-2xl font-semibold text-neutral-900">{data.quiz.title}</h1>
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
        <div className="space-y-3 rounded-2xl bg-blue-50 p-6">
          <Lock className="mx-auto h-8 w-8 text-amber-600" />
          <p className="text-sm font-semibold text-neutral-900">This is a premium quiz</p>
          <Paragraph color="muted" size="sm">
            Upgrade to unlock this quiz and start practicing.
          </Paragraph>
          <Button href="/pricing">View plans</Button>
        </div>
      ) : (
        <Button onClick={onStart}>{isExam ? "Start exam" : "Start test"}</Button>
      )}
    </div>
  );
}
