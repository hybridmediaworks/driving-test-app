import Link from "next/link";
import { Gem } from "lucide-react";
import Button from "@/components/ui/Button";
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
  image?: string;
  status?: string;
  style?: "large";
  completed?: boolean;
  justCompleted?: boolean;
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
        step.type === "free") && (
        <div
          className={`relative overflow-hidden md:rounded-xl rounded-md md:max-w-full w-full max-w-35`}
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
                  ? "bg-white/60 backdrop-blur-[2px] group-hover:bg-linear-to-r group-hover:from-blue-500 group-hover:to-blue-700"
                  : ""
              }`}
            >
              {step.locked && step.status !== "next" && (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-4xl group-hover:hidden">
                    <Gem className="text-blue-600 w-8 h-8 " />
                  </div>
                  <div className="hidden group-hover:flex px-2">
                    <Button
                      variant="outline"
                      className="w-full md:w-fit bg-yellow-500! border-yellow-500!"
                      size="sm"
                      href="/pricing"
                    >
                      <Gem /> Upgrade to Premium
                    </Button>
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
              className="absolute md:top-2 top-0.5 rounded-sm px-1.75 md:py-0.5 font-semibold md:tracking-wide uppercase md:right-2 right-0.5 bg-green-500"
            >
              Free
            </Paragraph>
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

  if (state && step.slug) {
    return (
      <Link href={`/${state}/${step.slug}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
