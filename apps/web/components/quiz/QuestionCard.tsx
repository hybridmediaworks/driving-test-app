import { Check, Circle, XIcon } from "lucide-react";
import type { PublicQuizQuestion, QuizAttemptAnswer } from "@driving-test-app/shared";
import Paragraph from "@/components/ui/Paragraph";

export default function QuestionCard({
  question,
  index,
  total,
  selectedAnswerId,
  onSelect,
  feedback,
}: {
  question: PublicQuizQuestion;
  index: number;
  total: number;
  selectedAnswerId: number | null;
  onSelect?: (answerId: number) => void;
  feedback?: QuizAttemptAnswer;
}) {
  const reviewing = feedback !== undefined;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
      {question.image_urls.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.image_urls[0]} alt="" className="max-h-64 w-full rounded-t-3xl object-cover" />
      )}
      <div className="p-6">
        <Paragraph color="primary" size="sm" className="mb-2 font-semibold">
          Question {index + 1} of {total}
          {question.topic && ` · ${question.topic}`}
        </Paragraph>
        <h2 className="mb-5 text-xl leading-snug font-bold text-neutral-900">{question.question_text}</h2>

        <div className="space-y-1">
          {question.answers.map((option) => {
            const isSelected = option.id === selectedAnswerId;
            const isCorrectOption = reviewing && option.id === feedback.correct_answer_id;
            const isWrongSelected = reviewing && isSelected && !feedback.is_correct;

            return (
              <div
                key={option.id}
                onClick={() => !reviewing && onSelect?.(option.id)}
                className={`flex items-start gap-3 rounded-xl p-3 ${
                  !reviewing ? "cursor-pointer hover:bg-neutral-50" : ""
                } ${isSelected && !reviewing ? "bg-neutral-100" : ""} ${reviewing && isCorrectOption ? "bg-green-50" : ""} ${
                  isWrongSelected ? "bg-red-50" : ""
                }`}
              >
                <div className="w-6 pt-0.5">
                  {reviewing ? (
                    isCorrectOption ? (
                      <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-green-600">
                        <Check className="w-3.5 stroke-white" />
                      </div>
                    ) : isWrongSelected ? (
                      <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500">
                        <XIcon className="w-3.5 stroke-white" />
                      </div>
                    ) : (
                      <Circle className="rounded-full stroke-neutral-300" />
                    )
                  ) : (
                    <Circle className={`rounded-full ${isSelected ? "fill-neutral-900 stroke-neutral-900" : "stroke-neutral-300"}`} />
                  )}
                </div>
                <Paragraph className={isWrongSelected ? "line-through" : ""}>{option.answer_text}</Paragraph>
              </div>
            );
          })}
        </div>

        {reviewing && feedback.explanation && (
          <Paragraph size="sm" className="mt-4 rounded-xl bg-neutral-50 p-3 text-neutral-600">
            {feedback.explanation}
          </Paragraph>
        )}
      </div>
    </div>
  );
}
