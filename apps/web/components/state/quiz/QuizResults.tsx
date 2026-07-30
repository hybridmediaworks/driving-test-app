import { ChevronRight, TriangleAlert, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

export default function QuizResults({
  stateName,
  incorrectCount,
  questionsLength,
  totalQuestionPool,
  riskAreas,
  extraRiskAreaCount,
  onExit,
}: {
  stateName: string;
  incorrectCount: number;
  questionsLength: number;
  totalQuestionPool: number;
  riskAreas: string[];
  extraRiskAreaCount: number;
  onExit: () => void;
}) {
  return (
    <section className="my-10 flex justify-center max-w-container mx-auto">
      <div className="w-full rounded-3xl border border-[#e5e7eb80] bg-white p-10 text-center shadow-xl">
        <div className="mx-auto max-w-155 space-y-6">
          <TriangleAlert className="mx-auto h-12 w-12 fill-amber-400 stroke-white" />
          <div className="space-y-2">
            <Heading as="h2" size="2xs">
              Test Complete. Diagnostic Warning.
            </Heading>
            <Paragraph color="muted">
              You missed {incorrectCount} questions on this {stateName} practice
              test.
            </Paragraph>
          </div>

          {riskAreas.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-left">
              <Paragraph
                size="xs"
                className="font-bold tracking-wide uppercase"
                color="dark"
              >
                Identified risk areas:
              </Paragraph>
              {riskAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                  {area}
                </span>
              ))}
              {extraRiskAreaCount > 0 && (
                <span className="text-sm text-grey">
                  +{extraRiskAreaCount} more
                </span>
              )}
            </div>
          )}

          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between text-xs font-bold tracking-wide uppercase">
              <span>Question coverage</span>
              <span className="normal-case">
                {questionsLength} / {totalQuestionPool}+
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-2 rounded-full bg-red-500"
                style={{
                  width: `${(questionsLength / totalQuestionPool) * 100}%`,
                }}
              />
            </div>
          </div>

          <Paragraph>
            You&apos;ve only practiced {questionsLength} questions today. But
            the real DMV test can throw <i>hundreds</i> of tricky rules and edge
            cases at you. We built a complete bank of{" "}
            <b>{totalQuestionPool}+ exam-like questions</b> to make sure
            you&apos;re ready for every single one.
          </Paragraph>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={ChevronRight}
            iconPosition="right"
          >
            Access all {totalQuestionPool}+ {stateName} exam-like questions
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="p-0! text-grey"
            onClick={onExit}
          >
            Continue to basic results
          </Button>
        </div>
      </div>
    </section>
  );
}
