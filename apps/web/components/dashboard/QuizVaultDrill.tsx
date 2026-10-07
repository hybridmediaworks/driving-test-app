"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogOut } from "lucide-react";
import type { QuizAnswerCheckResponse } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import HintPanel from "@/components/state/quiz/HintPanel";
import QuestionCard from "@/components/state/quiz/QuestionCard";
import { api } from "@/lib/api";
import { translate } from "@/lib/i18n/quiz";
import type { ChallengeBankQuestion } from "@/lib/useChallengeBank";

/**
 * Re-practise the vault as a mastery loop, the same drill the mobile app runs, in the same frame a
 * normal quiz is played in — these are quiz questions, and they should not look like a list.
 *
 *  - The questions are a queue; the one at the front is the current question.
 *  - Answered right → it graduates: out of the queue, and `missed` is cleared server-side by the
 *    check endpoint itself. A question they also bookmarked stays bookmarked.
 *  - Answered wrong → it goes back into the queue at a random later position, so it returns, but
 *    never straight away while other questions are left.
 *
 * It ends when the queue empties — every question answered right at least once — not after a set
 * number of steps. The queue is a snapshot taken once, so the server's own edits mid-session cannot
 * disturb the run.
 */
export default function QuizVaultDrill({
  questions,
  title,
  fallbackExitHref,
}: {
  questions: ChallengeBankQuestion[];
  title: string;
  /** Where Exit goes when there is no history to go back to — a vault opened in a fresh tab. */
  fallbackExitHref: string;
}) {
  const router = useRouter();

  // Exit returns them wherever they came from — a state page, the dashboard, a quiz they finished —
  // rather than a fixed destination, since the vault is reachable from several places.
  const exit = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackExitHref);
  };

  const total = questions.length;
  const [queue, setQueue] = useState<ChallengeBankQuestion[]>(questions);
  const [checked, setChecked] = useState<QuizAnswerCheckResponse | null>(null);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(true);
  // How each question has gone THIS run, for the progress grid. A question answered wrong goes back
  // into the queue, so this can flip from "wrong" to "cleared" when it comes round again.
  const [outcomes, setOutcomes] = useState<Record<number, "cleared" | "wrong">>(
    {},
  );

  // The drill is English-only for now: there is no per-quiz language choice to inherit here, and
  // QuestionCard needs a translator for its own labels either way.
  const t = (
    key: Parameters<typeof translate>[1],
    vars?: Record<string, string | number>,
  ) => translate("en", key, vars);

  const current = queue[0];

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="text-5xl">🎉</span>
        <div className="space-y-1">
          <Paragraph
            size="2xl"
            color="dark"
            className="font-sora font-semibold"
          >
            That is the lot
          </Paragraph>
          <Paragraph color="muted">
            You answered every one of them right. They have left your vault.
          </Paragraph>
        </div>
        <Button onClick={exit}>Done</Button>
      </div>
    );
  }

  // Correct answers graduate the moment they land, so the count drops before Next is pressed.
  const remaining = queue.length - (checked?.is_correct ? 1 : 0);
  const cleared = total - remaining;
  const missedThisRun = Object.values(outcomes).filter(
    (outcome) => outcome === "wrong",
  ).length;

  async function selectOption(answerId: number) {
    if (checked || grading) return;
    setSelectedId(answerId);
    setGrading(true);
    setError(null);
    try {
      // The question carries the quiz it came from, so the ordinary check endpoint grades it — and
      // clears `missed` for a correct answer without this screen having to ask separately.
      const res = await api.post<QuizAnswerCheckResponse>(
        `/quizzes/${current.quiz_id}/questions/${current.id}/check`,
        { answer_id: answerId },
      );
      setChecked(res);
      setOutcomes((prev) => ({
        ...prev,
        [current.id]: res.is_correct ? "cleared" : "wrong",
      }));
    } catch {
      setSelectedId(undefined);
      setError("That answer could not be checked. Try again.");
    } finally {
      setGrading(false);
    }
  }

  function next() {
    if (!checked) return;
    const [head, ...rest] = queue;

    if (checked.is_correct) {
      setQueue(rest);
    } else if (rest.length === 0) {
      setQueue([head]); // the only one left — it simply comes round again
    } else {
      const at = 1 + Math.floor(Math.random() * rest.length);
      const reinserted = [...rest];
      reinserted.splice(at, 0, head);
      setQueue(reinserted);
    }

    setChecked(null);
    setSelectedId(undefined);
  }

  const finishes = !!checked?.is_correct && queue.length === 1;

  return (
    <>
      <div className="sticky top-0 z-90 bg-white dark:bg-neutral-800">
        <div className="mx-5 flex max-w-container items-center justify-between gap-3 py-3.5 lg:mx-auto">
          <Button
            onClick={exit}
            variant="ghost"
            className="p-0! text-neutral-700 dark:text-neutral-300"
          >
            <LogOut className="h-4 w-4 rotate-180" /> Exit
          </Button>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              Vault
            </span>
            <Paragraph size="sm" color="dark" className="font-semibold">
              {title}
            </Paragraph>
          </div>
          <span className="w-12" />
        </div>
        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-700">
          <div
            className="h-full bg-blue-600 transition-[width] duration-300"
            style={{ width: `${total === 0 ? 0 : (cleared / total) * 100}%` }}
          />
        </div>
      </div>

      <section className="px-5 pt-6 pb-35 lg:pt-15">
        <div className="mx-auto grid max-w-container grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 rounded-3xl border border-border bg-white p-5 shadow-[0_20px_50px_-26px_rgba(23,37,84,0.25)] lg:col-span-2 lg:p-8 dark:bg-neutral-800">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Paragraph
                size="sm"
                color="primary"
                className="rounded-full bg-blue-50 px-3 py-1 font-semibold dark:bg-blue-500/10"
              >
                {current.topic ?? "General"}
              </Paragraph>
              <Paragraph size="sm">
                <strong>Cleared</strong> {cleared}/{total}
              </Paragraph>
            </div>

            <QuestionCard
              question={current}
              selectedOptionId={selectedId}
              checkResult={checked ?? undefined}
              onSelectOption={(id) => void selectOption(id)}
              t={t}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)] dark:bg-neutral-800">
              <div className="border-b border-border pb-4">
                <Paragraph size="2xl" color="dark" className="font-semibold">
                  Your Progress
                </Paragraph>
                <Paragraph size="sm">{remaining} left to get right</Paragraph>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-neutral-900 px-3 py-1 text-white dark:bg-neutral-100 dark:text-neutral-900">
                  All <span className="opacity-70">{total}</span>
                </span>
                <span className="rounded-full bg-green-50 px-3 py-1 text-green-600 dark:bg-green-500/10">
                  Cleared <span className="opacity-70">{cleared}</span>
                </span>
                <span className="rounded-full bg-red-50 px-3 py-1 text-red-500 dark:bg-red-500/10">
                  Missed <span className="opacity-70">{missedThisRun}</span>
                </span>
              </div>

              {/* One cell per question in the vault, in the order the run started with. The queue
                reorders as questions come back, so the numbering stays put and the colour moves. */}
              <div className="grid grid-cols-8 gap-1.5">
                {questions.map((question, index) => {
                  const outcome = outcomes[question.id];
                  const isCurrent = question.id === current.id;
                  const cellClass = isCurrent
                    ? "border-transparent bg-linear-to-r from-blue-500 to-blue-700 text-white"
                    : outcome === "cleared"
                      ? "border-green-200 bg-green-50 text-green-500"
                      : outcome === "wrong"
                        ? "border-red-200 bg-red-50 text-red-500"
                        : "border-border bg-background text-neutral-500 dark:text-neutral-400";

                  return (
                    <span
                      key={question.id}
                      className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold ${cellClass}`}
                    >
                      {index + 1}
                    </span>
                  );
                })}
              </div>

              <Paragraph size="sm" color="muted">
                Get a question right and it leaves your vault. Miss it and it
                comes back later in this run, until you have them all.
              </Paragraph>
            </div>

            {/* The same tutor the quiz carries, in its own card below the progress one just as it
                sits there. Keyed by question so its conversation resets as the queue moves on, and
                told whether this one has been answered so it knows when it may name the option. */}
            <HintPanel
              key={current.id}
              quizId={current.quiz_id}
              questionId={current.id}
              answered={!!checked}
              selectedAnswerId={selectedId}
              open={hintOpen}
              onToggle={() => setHintOpen((v) => !v)}
              t={t}
            />
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 h-20 w-full border-t border-border bg-white px-5 py-4 dark:bg-neutral-800">
        <div className="mx-auto flex max-w-container items-center justify-between gap-2">
          <Paragraph size="sm" color="muted">
            {checked
              ? checked.is_correct
                ? "Right — that one is out of your vault."
                : "Not that one. It will come back later in this run."
              : "Pick an answer to see how you did."}
          </Paragraph>
          <Button onClick={next} disabled={!checked}>
            {finishes ? "Finish" : "Next Question"}{" "}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
