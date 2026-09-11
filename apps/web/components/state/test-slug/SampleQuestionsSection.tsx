"use client";

import { useState } from "react";
import type { SampleQuizQuestion } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { usePinnedScroll } from "@/lib/usePinnedScroll";
import { useSampleQuestions } from "@/lib/useQuizQuestions";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useWebLayout } from "@/lib/web-layout-context";
import { ChevronDown } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const SAMPLE_SIZE = 6;

const NUMBER_WORDS: Record<number, string> = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
};

/**
 * "Six real {ST} questions" — a scrollable stack of this test's own questions with a per-card
 * answer/explanation disclosure (Figma node 4276:10180). Reads GET
 * /quizzes/{id}/sample-questions, the preview endpoint that attaches the correct answer and
 * explanation; a locked premium test comes back empty, so the section simply doesn't render.
 */
export default function SampleQuestionsSection({ testSlug }: { testSlug: string }) {
  const { selectedState } = useWebLayout();
  const quiz = useResolvedQuiz(testSlug);
  const questions = useSampleQuestions(quiz?.id, SAMPLE_SIZE);
  const stateCode = quiz?.state?.code ?? "";
  const sample = questions.slice(0, SAMPLE_SIZE);
  const { spacerRef, stickyRef, viewportRef, contentRef } = usePinnedScroll(sample.length);

  if (sample.length === 0) return null;

  const countWord = NUMBER_WORDS[sample.length] ?? String(sample.length);

  return (
    // The question scroller runs to the frame's bottom edge in Figma — the 120px of air below
    // belongs to the next section, not this one.
    <section className="px-5 py-15 lg:pt-30 lg:pb-0">
      {/* The section locks to the screen and steps through the questions as you scroll, in either
          direction, releasing the page once the last one is up. The box below carries the extra
          scroll length that costs — see lib/usePinnedScroll.ts. */}
      <div ref={spacerRef}>
        <div
          ref={stickyRef}
          className="mx-auto flex max-w-container flex-col items-start justify-between gap-10 lg:flex-row"
        >
          <div className="flex w-full flex-col gap-6 lg:max-w-94.75">
            <Heading as="h2">
              {countWord} real {stateCode || selectedState} questions
            </Heading>
            <Paragraph size="xl">
              Written and verified against the current {selectedState} Driver’s Manual. Try one, then reveal the
              answer and explanation.
            </Paragraph>
          </div>

          {/* Fixed-height viewport on desktop, exactly as in Figma — the stack keeps going past the
              fold so it reads as a bank of questions rather than a finite list. */}
          <div ref={viewportRef} className="w-full lg:h-159 lg:w-221.25 lg:overflow-hidden">
            <div ref={contentRef} className="flex flex-col gap-5">
              {sample.map((question, index) => (
                <QuestionCard key={question.id} question={question} index={index} total={sample.length} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuestionCard({ question, index, total }: { question: SampleQuizQuestion; index: number; total: number }) {
  const [revealed, setRevealed] = useState(index === 0);

  const answers = question.answers ?? [];
  const correctIndex = answers.findIndex((answer) => answer.is_correct);
  const correct = correctIndex >= 0 ? answers[correctIndex] : null;
  const explanation = correct?.explanation ?? question.explanation;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-background2 dark:border-white/10 bg-white dark:bg-neutral-800 p-8 shadow-[0px_20px_50px_-26px_rgba(23,37,84,0.25)]">
      <div className="flex items-center gap-1 text-sm leading-5 font-semibold">
        <span className="text-neutral-700 dark:text-neutral-300">Questions</span>
        <span className="text-neutral-500 dark:text-neutral-400">
          {index + 1}/{total}
        </span>
      </div>

      <h3 className="text-xl leading-7.5 font-semibold text-neutral-900 dark:text-neutral-100">
        {question.question_text}
      </h3>

      {answers.length > 0 && (
        <div className="flex flex-col gap-3">
          {answers.map((answer, answerIndex) => (
            <div
              key={answer.id}
              className="flex items-center gap-4 rounded-xl border border-background3 dark:border-white/10 bg-white dark:bg-neutral-800 px-4.25 py-3.25"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700 text-[11.2px] font-bold text-neutral-500 dark:text-neutral-300">
                {LETTERS[answerIndex] ?? answerIndex + 1}
              </span>
              <p className="flex-1 font-medium text-neutral-700 dark:text-neutral-300">{answer.answer_text}</p>
            </div>
          ))}
        </div>
      )}

      {correct && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-4">
          <button
            type="button"
            onClick={() => setRevealed((open) => !open)}
            aria-expanded={revealed}
            className="flex w-full items-center gap-2.5 text-left text-sm leading-5 font-semibold text-blue-600 dark:text-blue-400"
          >
            <span className="flex-1">{revealed ? "Hide" : "Show"} Answer and Explanation</span>
            <ChevronDown className={`size-4 shrink-0 transition-transform ${revealed ? "rotate-180" : ""}`} />
          </button>

          {revealed && (
            <div className="flex flex-col gap-2 pt-3">
              <p className="font-semibold text-green-600">
                Correct answer: {LETTERS[correctIndex] ?? correctIndex + 1} - {correct.answer_text}
              </p>
              {explanation && <p className="text-sm leading-5 text-neutral-700 dark:text-neutral-300">{explanation}</p>}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
