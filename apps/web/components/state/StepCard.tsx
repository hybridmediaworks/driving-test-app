import Link from "next/link";
import { BookMarked, Check, Gem, Lock } from "lucide-react";
import Paragraph from "@/components/ui/Paragraph";

type Step = {
  title?: string;
  slug?: string;
  questions?: number;
  total?: string;
  duration?: string;
  totalQuestions?: string;
  totalTime?: string;
  type?: "free" | "premium";
  locked?: boolean;
  /** Why a locked step is locked — decides what a click does (see the wrapper at the bottom):
   *  "premium" (not paid) → whole card goes to /pricing; "progress" (paid, previous test not yet
   *  finished) → the card doesn't navigate at all. Undefined when the step is unlocked. */
  lockMode?: "premium" | "progress";
  /** The current user's result on a completed quiz — "passed" shows a green tick, "failed" a red
   *  mark (top-right of the card). Undefined until the quiz has been completed. */
  outcome?: "passed" | "failed";
  image?: string;
  status?: string;
  style?: "large";
  completed?: boolean;
  justCompleted?: boolean;
  placeholder?: boolean;
};

export default function StepCard({
  step,
  state,
  cardType,
  connector = false,
}: {
  step: Step;
  state?: string;
  /** Unit label appended after `step.total`, e.g. cardType="hazards" -> "9 hazards" — only used by the driving-test card shape. */
  cardType?: string;
  /** Shows the mobile-only progress connector line driven by step.completed/justCompleted — only meaningful in the phase-progress step list (TestSteps). */
  connector?: boolean;
}) {
  const isFilled = !!step.completed && !step.justCompleted;
  const isTrigger = !!step.justCompleted;

  // A non-quiz "coming soon" rung — rendered inside the step grid so it inherits the same ladder
  // connectors as a real step, but shows a guides-being-prepared message instead of a quiz card.
  if (step.placeholder) {
    return (
      <div
        className={`relative flex md:min-h-32 items-center gap-3 rounded-xl border bg-white p-4 ${
          step.style === "large" ? "lg:col-span-2" : ""
        }`}
      >
        <div className="flex min-w-10 min-h-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <BookMarked className="w-4.5 h-4.5" />
        </div>
        <Paragraph color="muted" size="sm">
          Downloadable study guides for this section are being prepared — check back soon.
        </Paragraph>
      </div>
    );
  }

  const content = (
    <div
      className={`group flex md:flex-col items-center md:items-start cursor-pointer rounded transition-all duration-300 hover:-translate-y-0.75 ${
        step.style === "large" ? "lg:col-span-2" : ""
      }`}
    >
      {connector && (
        <div
          className={`md:hidden md:w-15 w-8.5 absolute left-6.5 ms-auto md:border-l-14 border-l-8 top-4 h-full z-0 ${
            isFilled
              ? "border-blue-500"
              : isTrigger
                ? "connector-fill border-white"
                : "border-white"
          }`}
          style={
            isTrigger
              ? ({ "--fill-index": 0 } as React.CSSProperties)
              : undefined
          }
        />
      )}
      {(step.image ||
        step.locked ||
        step.status === "next" ||
        step.type === "free" ||
        step.type === "premium") && (
        <div
          className={`relative overflow-hidden md:rounded-xl rounded-md md:max-w-full w-full max-w-35 ${
            step.status === "next" ? "next-glow" : ""
          }`}
        >
          {step.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={step.image}
              alt=""
              className="md:h-32 h-18 w-full md:rounded-xl rounded-md object-cover transition-all duration-300"
            />
          )}
          {(step.locked || step.status === "next") && (
            <div
              className={`absolute inset-0 flex items-center justify-center md:rounded-xl rounded-md ${
                step.locked && step.status !== "next"
                  ? step.lockMode === "progress"
                    ? "bg-white/60 backdrop-blur-[2px]"
                    : "bg-white/60 backdrop-blur-[2px] group-hover:bg-linear-to-r group-hover:from-blue-500 group-hover:to-blue-700"
                  : ""
              }`}
            >
              {step.locked && step.status !== "next" && step.lockMode === "progress" && (
                // Paid learner who hasn't finished the previous test yet — a blue circle badge with a
                // white lock, no upsell, and (see the wrapper below) the card doesn't navigate on click.
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 shadow-md">
                  <Lock className="h-5 w-5 text-white" />
                </div>
              )}
              {step.locked && step.status !== "next" && step.lockMode !== "progress" && (
                // Not entitled — the whole card links to /pricing (see the wrapper below), so the
                // hover CTA is a plain span here rather than a nested link.
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-4xl group-hover:hidden">
                    <Gem className="text-blue-600 w-8 h-8 " />
                  </div>
                  <div className="hidden group-hover:flex px-2">
                    <span className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-yellow-500 bg-yellow-500 px-3 py-1.5 text-sm font-semibold text-black md:w-fit">
                      <Gem className="h-4 w-4" /> Upgrade to Premium
                    </span>
                  </div>
                </>
              )}
              {step.status === "next" && (
                <Paragraph
                  size="sm"
                  color="primary"
                  className="rounded-full bg-white px-3 py-0.5 font-semibold"
                >
                  Next
                </Paragraph>
              )}
            </div>
          )}
          {step.type === "free" && (
            <Paragraph
              color="white"
              size="xs"
              className="absolute md:top-2 top-0.5 rounded-sm px-1.75 md:py-0.5 font-semibold md:tracking-wide uppercase md:left-2 left-0.5 bg-green-500"
            >
              Free
            </Paragraph>
          )}
          {step.type === "premium" && (
            <Paragraph
              color="white"
              size="xs"
              className="absolute md:top-2 top-0.5 rounded-sm px-1.75 md:py-0.5 font-semibold md:tracking-wide uppercase md:left-2 left-0.5 bg-orange-500"
            >
              Premium
            </Paragraph>
          )}
          {/* Completed-quiz result badge, top-right (the FREE/PREMIUM tag sits top-left). Passed →
              green tick, failed → red exclamation. Shown once the learner has taken the quiz. */}
          {step.outcome === "passed" && (
            <div className="absolute md:top-2 top-0.5 md:right-2 right-0.5 flex md:h-7 h-5 md:w-7 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
              <Check className="md:h-4 h-3 md:w-4 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          {step.outcome === "failed" && (
            <div className="absolute md:top-2 top-0.5 md:right-2 right-0.5 flex md:h-7 h-5 md:w-7 w-5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white">
              <span className="md:text-sm text-xs font-bold leading-none text-white">!</span>
            </div>
          )}
        </div>
      )}

      {(step.title ||
        step.questions !== undefined ||
        step.total ||
        step.duration ||
        step.totalQuestions ||
        step.totalTime) && (
        <div className="md:p-4 px-3 md:space-y-2">
          {step.title && (
            <Paragraph color="dark" className="font-semibold">
              {step.title}
            </Paragraph>
          )}
          {(step.questions !== undefined ||
            step.total ||
            step.duration ||
            step.totalQuestions ||
            step.totalTime) && (
            <Paragraph color="primary" size="sm" className="font-semibold">
              {step.questions !== undefined && `${step.questions} questions`}
              {step.total && `${step.total}${cardType ? ` ${cardType}` : ""}`}
              {step.duration && step.duration}
              {step.totalQuestions && `${step.totalQuestions} questions`}
              {step.totalQuestions && step.totalTime && " · ~"}
              {step.totalTime && `${step.totalTime} min`}
            </Paragraph>
          )}
        </div>
      )}
    </div>
  );

  // Where a click goes depends on why (if at all) the step is locked:
  //  - unlocked → open the test.
  //  - locked + "premium" (not paid) → straight to /pricing.
  //  - locked + "progress" (paid, previous test not finished) → nowhere; the card is inert.
  const href = step.locked
    ? step.lockMode === "premium"
      ? "/pricing"
      : null
    : state && step.slug
      ? `/${state}/${step.slug}`
      : null;

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
