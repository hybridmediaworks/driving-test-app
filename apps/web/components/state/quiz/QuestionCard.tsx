import { Volume2 } from "lucide-react";
import Paragraph from "@/components/ui/Paragraph";
import QuestionAnimation from "@/components/quiz/QuestionAnimation";
import type { PublicQuizQuestion } from "@driving-test-app/shared";

/**
 * Renders a question while it's still being played (pre-submission). The real backend
 * deliberately never sends `is_correct`/`explanation` for an answer before the whole attempt is
 * submitted (see `Public\QuizController::show` on the API side) — so, unlike the mocked version
 * this replaced, there is no per-option correct/incorrect reveal here. That feedback only exists
 * after grading, in the results screen (matches how `components/quiz/QuestionCard.tsx` — the
 * already-real `/quizzes/[id]` player — has always behaved).
 */
export default function QuestionCard({
  question,
  selectedOptionId,
  voiceOver = false,
  fontScale = 1,
  onSelectOption,
}: {
  question: PublicQuizQuestion;
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
  const lottieAsset = question.assets.find((asset) => asset.type === "lottie");

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
            {question.question_text}
          </Paragraph>
        </div>
        {lottieAsset ? (
          <QuestionAnimation asset={lottieAsset} />
        ) : (
          question.image_urls[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.image_urls[0]}
              alt={question.question_text}
              className="max-h-64 w-full rounded-xl object-cover"
            />
          )
        )}
        <div style={{ zoom: fontScale }}>
          <div className="space-y-3">
            {question.answers.map((option, index) => {
              const isSelected = option.id === selectedOptionId;
              const optionLetter = String.fromCharCode(65 + index);

              return (
                <div
                  key={option.id}
                  onClick={() => onSelectOption(option.id)}
                  className={`group cursor-pointer rounded-lg border p-3 hover:bg-neutral-50 ${
                    isSelected ? "border-blue-500 bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-start gap-3">
                    <div
                      className={`font-bold text-sm min-w-7.5 min-h-7.5 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {optionLetter}
                    </div>
                    <Paragraph className="font-medium min-h-7.5 flex items-center">{option.answer_text}</Paragraph>
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
