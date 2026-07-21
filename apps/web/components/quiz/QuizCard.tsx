import Link from "next/link";
import type { PublicQuiz } from "@driving-test-app/shared";

export default function QuizCard({ quiz }: { quiz: PublicQuiz }) {
  const isExam = quiz.quiz_type?.name === "final";

  return (
    <Link
      href={`/quizzes/${quiz.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">{quiz.title}</h3>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {quiz.is_premium && (
            <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">Premium</span>
          )}
          {isExam && (
            <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-800">Exam simulation</span>
          )}
        </div>
      </div>
      <p className="text-sm text-neutral-500">
        {quiz.category?.title}
        {quiz.state && ` · ${quiz.state.name}`}
        {quiz.vehicle_type && ` · ${quiz.vehicle_type.title}`}
      </p>
      <p className="text-sm text-neutral-500">
        {quiz.total_questions} questions
        {quiz.duration_seconds && ` · ${Math.round(quiz.duration_seconds / 60)} min`}
        {` · ${quiz.test_track === "permit_test" ? "Permit Test" : "Driving Test"}`}
        {isExam && quiz.passing_score_percent != null && ` · pass mark ${quiz.passing_score_percent}%`}
      </p>
    </Link>
  );
}
