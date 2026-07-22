import { Check, Circle, Volume2, XIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import type { QuizQuestionStatic } from "./types";
import Heading from "@/components/ui/Heading";

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
      <div className="space-y-4">
        <div className="relative" style={{ zoom: fontScale }}>
          {voiceOver && (
            <Volume2 className="absolute top-1 -left-9 h-7 w-7 rounded-full bg-blue-600 p-1.5 text-white" />
          )}
          <Paragraph
            size="2xl"
            className="font-semibold font-sora"
            color="dark"
          >
            {question.question}
          </Paragraph>
        </div>
        {question.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.img}
            alt={question.question}
            className="max-h-64 w-full rounded-xl object-cover"
          />
        )}
        <div style={{ zoom: fontScale }}>
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isWrongSelected =
                isAnswered &&
                option.id === selectedOptionId &&
                !option.isCorrect;
              const isCorrectAnswer = isAnswered && option.isCorrect;
              const optionLetter = String.fromCharCode(65 + index);

              return (
                <div key={option.id}>
                  <div
                    onClick={() => onSelectOption(option.id)}
                    className={`group rounded-lg p-3 border space-y-4 ${
                      !isAnswered ? "cursor-pointer hover:bg-neutral-50" : ""
                    } ${isWrongSelected ? "bg-red-50 border-red-500" : isCorrectAnswer ? "bg-green-50 border-green-500" : ""}`}
                  >
                    <div className="flex items-center justify-start gap-3">
                      <div
                        className={`font-bold text-sm min-w-7.5 min-h-7.5 rounded-full flex items-center justify-center ${
                          isWrongSelected
                            ? "bg-red-500 text-white"
                            : isCorrectAnswer
                              ? "bg-green-600 text-white"
                              : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {optionLetter}
                      </div>
                      <Paragraph
                        className={`font-medium ${
                          option.id === selectedOptionId && !option.isCorrect
                            ? "line-through"
                            : ""
                        }`}
                      >
                        {option.text}
                      </Paragraph>
                      {(isWrongSelected || isCorrectAnswer) && (
                        <Paragraph
                          className="ml-auto flex shrink-0 items-center font-semibold leading-6!"
                          size="xs"
                        >
                          {isWrongSelected ? (
                            <span className="flex items-center gap-1.5">
                              <span className="rounded-full border border-red-500 bg-white px-2.5 py-1 text-red-600">
                                Your answer
                              </span>
                              <XIcon className="min-h-4 min-w-4 rounded-full bg-red-500 stroke-white p-0.5" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <span className="rounded-full border border-green-500 bg-white px-2.5 py-1 text-green-600">
                                Correct answer
                              </span>
                              <Check className="min-h-4 min-w-4 rounded-full bg-green-600 stroke-white p-0.5" />
                            </span>
                          )}
                        </Paragraph>
                      )}
                    </div>

                    {isAnswered && option.id === selectedOptionId && (
                      <div className="relative">
                        {voiceOver && (
                          <Volume2 className="absolute top-0 -left-8.5 mt-2 h-6 w-6 rounded-full bg-blue-600 p-1 text-white" />
                        )}
                        <Paragraph>{option.explanation}</Paragraph>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
