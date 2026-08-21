import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";

const TOTAL_LABEL = "500+";
const TOTAL_NUM = 500;

/**
 * Compact premium upsell card shown in the results' right column for non-premium users. Frames the
 * finished test as a small slice of the full exam bank and points to pricing.
 */
export default function ReadinessUpsell({
  stateName,
  stateCode,
  seenCount,
}: {
  stateName: string;
  stateCode: string;
  seenCount: number;
}) {
  const pct = Math.max(3, Math.min(100, Math.round((seenCount / TOTAL_NUM) * 100)));

  return (
    <div className="mt-3 rounded-2xl border border-amber-200 bg-linear-to-b from-amber-50 to-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">🎯</span>
        <Paragraph size="lg" color="dark" className="font-bold">
          Readiness check
        </Paragraph>
      </div>

      <Paragraph size="sm" className="mt-2">
        You&apos;ve seen only <strong className="text-amber-600">{seenCount}</strong> of{" "}
        <strong className="text-amber-600">{TOTAL_LABEL}</strong> exam-like questions.
      </Paragraph>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="uppercase tracking-wide text-neutral-500">Question coverage</span>
          <span className="text-neutral-800">
            {seenCount} / {TOTAL_LABEL}
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Paragraph size="sm" className="mt-3">
        The real {stateName} DMV exam pulls from a much wider bank. Premium unlocks the full question
        bank, and <strong>95% of Premium users pass on their first real try</strong>.
      </Paragraph>

      <Button href="/pricing" className="mt-4 w-full">
        Access all {TOTAL_LABEL} {stateCode} questions <ArrowRight className="size-4.5" />
      </Button>
    </div>
  );
}
