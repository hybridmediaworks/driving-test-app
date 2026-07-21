import type { PublicQuizQuestion, QuizAttempt } from "@driving-test-app/shared";
import QuestionCard from "@/components/quiz/QuestionCard";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";

export default function ExamResults({
  attempt,
  questions,
  quizId,
}: {
  attempt: QuizAttempt;
  questions: PublicQuizQuestion[];
  quizId: number;
}) {
  const answersByQuestion = new Map((attempt.answers ?? []).map((a) => [a.question_id, a]));
  const passed = attempt.passed;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-3xl border p-6 text-center shadow-sm ${
          passed === true ? "border-green-100 bg-green-50" : passed === false ? "border-red-100 bg-red-50" : "border-gray-100 bg-white"
        }`}
      >
        {passed !== null && (
          <p className={`mb-2 text-2xl font-bold ${passed ? "text-green-700" : "text-red-600"}`}>
            {passed ? "Passed" : "Not passed"}
          </p>
        )}
        <Paragraph color="primary" size="sm" className="font-semibold">Your score</Paragraph>
        <p className="my-2 text-4xl font-bold text-neutral-900">{Math.round(attempt.score)}%</p>
        <Paragraph color="muted">
          {attempt.correct_count} of {attempt.total_questions} correct
        </Paragraph>
        <div className="mt-4 flex justify-center gap-3">
          <Button href={`/quizzes/${quizId}`} variant="outline">Retake exam</Button>
          <Button href="/exam-simulator">More exams</Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, i) => {
          const feedback = answersByQuestion.get(question.id);
          if (!feedback) return null;

          return (
            <QuestionCard
              key={question.id}
              question={question}
              index={i}
              total={questions.length}
              selectedAnswerId={feedback.selected_answer_id}
              feedback={feedback}
            />
          );
        })}
      </div>
    </div>
  );
}
