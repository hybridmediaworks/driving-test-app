import { Check, Circle, Volume2, XIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import type { QuizQuestionStatic } from "./types";

export default function QuestionCard({
  question,
  selectedOptionId,
  isAnswered,
  isLastQuestion,
  isViewingFurthest,
  voiceOver = false,
  fontScale = 1,
  footerPosition = "inside",
  onSelectOption,
  onNextQuestion,
  onSeeResults,
}: {
  question: QuizQuestionStatic;
  selectedOptionId: number | undefined;
  isAnswered: boolean;
  isLastQuestion: boolean;
  isViewingFurthest: boolean;
  voiceOver?: boolean;
  fontScale?: number;
  footerPosition?: "inside" | "outside";
  onSelectOption: (optionId: number) => void;
  onNextQuestion: () => void;
  onSeeResults: () => void;
}) {
  const footer = isAnswered && isViewingFurthest && (
    <>
      {!isLastQuestion ? (
        <Button variant="outline" onClick={onNextQuestion}>
          Next question
        </Button>
      ) : (
        <Button variant="outline" onClick={onSeeResults}>
          See Results
        </Button>
      )}
    </>
  );

  return (
    <>
      <div className="rounded-3xl border border-[#e5e7eb80] bg-white shadow-xl">
        {question.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.img}
            alt={question.question}
            className="max-h-64 w-full rounded-t-xl object-cover"
          />
        )}
        <div style={{ zoom: fontScale }} className="p-6">
          <Paragraph color="primary" size="sm" className="mb-2 font-semibold">
            {question.category}
          </Paragraph>
          <div className="relative">
            {voiceOver && (
              <Volume2 className="absolute top-1 -left-9 h-7 w-7 rounded-full bg-blue-600 p-1.5 text-white" />
            )}
            <h2 className="mb-5 text-2xl leading-snug font-bold">{question.question}</h2>
          </div>

          <div className="space-y-1">
            {question.options.map((option) => (
              <div key={option.id}>
                <div
                  onClick={() => onSelectOption(option.id)}
                  className={`group flex items-start justify-start gap-3 rounded-xl p-3 ${
                    !isAnswered ? "cursor-pointer hover:bg-neutral-50" : ""
                  } ${isAnswered && option.id === selectedOptionId ? "bg-neutral-100" : ""}`}
                >
                  <div className="w-6 pt-0.5">
                    {!isAnswered || (option.id !== selectedOptionId && !option.isCorrect) ? (
                      <Circle className="rounded-full stroke-neutral-300 transition-all group-hover:stroke-12" />
                    ) : option.id === selectedOptionId && !option.isCorrect ? (
                      <XIcon className="rounded-full bg-red-500 stroke-white p-0.5" />
                    ) : (
                      <div className="flex h-4.5 w-4.5 rotate-45 items-center justify-center bg-green-600">
                        <Check className="w-7 -rotate-45 stroke-white p-0.5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Paragraph
                      className={
                        option.id === selectedOptionId && !option.isCorrect ? "line-through" : ""
                      }
                    >
                      {option.text}
                    </Paragraph>
                    {isAnswered && option.id === selectedOptionId && (
                      <div className="relative">
                        {voiceOver && (
                          <Volume2 className="absolute top-0 -left-8.5 mt-2 h-6 w-6 rounded-full bg-blue-600 p-1 text-white" />
                        )}
                        <Paragraph className="flex min-h-9 items-center" size="sm">
                          {option.explanation}
                        </Paragraph>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {footerPosition === "inside" && footer && (
          <div className="flex items-center justify-end gap-4 border-t border-neutral-100 p-6">{footer}</div>
        )}
      </div>

      {footerPosition === "outside" && footer && (
        <div className="mt-5 flex items-center justify-end gap-4">{footer}</div>
      )}
    </>
  );
}
