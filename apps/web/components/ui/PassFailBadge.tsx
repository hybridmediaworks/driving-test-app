import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Pass/fail indicator shared by the quiz and hazard-simulator results screens — a tick for a pass,
 * a warning triangle for a fail. Renders nothing when `passed` is null (no passing threshold set
 * on the quiz/simulator, so there's nothing to verdict — score-only).
 */
export default function PassFailBadge({
  passed,
  passedLabel = "Passed",
  failedLabel = "Not passed",
  size = "md",
}: {
  passed: boolean | null;
  passedLabel?: string;
  failedLabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (passed === null) return null;

  const Icon = passed ? CheckCircle2 : AlertTriangle;
  const textSize = size === "lg" ? "text-2xl font-bold" : size === "sm" ? "text-sm font-medium" : "text-base font-semibold";
  const iconSize = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <p className={`flex items-center justify-center gap-1.5 ${passed ? "text-green-600" : "text-red-600"} ${textSize}`}>
      <Icon className={`${iconSize} shrink-0`} />
      {passed ? passedLabel : failedLabel}
    </p>
  );
}
