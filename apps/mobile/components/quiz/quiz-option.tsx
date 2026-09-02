import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { CorrectConfetti, CorrectGlow } from "./correct-confetti";

/**
 * One answer row in the quiz, matching the web quiz's option
 * (apps/web/components/state/quiz/QuestionCard.tsx): an A/B/C/D letter badge, the answer text, and
 * — once graded — a green tick on the correct answer / red cross on a wrong pick, the
 * "Correct answer" / "Your answer" pills, an inline explanation, and (only when the learner picks
 * it right) the confetti burst from the badge plus a green glow pulse.
 *
 * `variant` mirrors web's box/badge state machine:
 *  - "correct"  → the right answer (green). Shown green whether or not the learner picked it.
 *  - "wrong"    → the learner's own incorrect pick (red).
 *  - "selected" → chosen but not yet graded (blue).
 *  - "idle"     → default / other options.
 * `celebrate` (confetti + glow) is only true for the correct option the learner actually picked.
 */

export type QuizOptionVariant = "correct" | "wrong" | "selected" | "idle";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizOption({
  index,
  text,
  variant,
  celebrate = false,
  explanation,
  correctLabel = "Correct answer",
  yourLabel = "Your answer",
  onPress,
  disabled,
  loading = false,
  burstKey,
}: {
  index: number;
  text: string;
  variant: QuizOptionVariant;
  celebrate?: boolean;
  /** Passed only when this row should reveal it (correct pick, or the learner's wrong pick). */
  explanation?: string | null;
  correctLabel?: string;
  yourLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Shows a spinner on this row while its answer is being graded (server round-trip). */
  loading?: boolean;
  /** Changes per question so the confetti/glow remount and replay each time. */
  burstKey?: string | number;
}) {
  const box =
    variant === "correct"
      ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
      : variant === "wrong"
        ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
        : variant === "selected"
          ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
          : "border-secondary-200 dark:border-secondary-700";

  const badge =
    variant === "correct"
      ? "bg-green-500"
      : variant === "wrong"
        ? "bg-red-500"
        : variant === "selected"
          ? "bg-blue-600"
          : "bg-secondary-100 dark:bg-secondary-800";

  const badgeText =
    variant === "idle" ? "text-secondary-500 dark:text-secondary-400" : "text-white";

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.75}
      onPress={onPress}
      disabled={disabled}
      className={`relative rounded-xl border p-3 ${box}`}
    >
      {celebrate && <CorrectGlow key={`glow-${burstKey}`} radius={12} />}

      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-start gap-3">
          <View className={`h-8 w-8 items-center justify-center rounded-full ${badge}`}>
            <Text className={`text-sm font-bold ${badgeText}`}>{LETTERS[index] ?? "?"}</Text>
            {celebrate && <CorrectConfetti key={`confetti-${burstKey}`} />}
          </View>

          <Text className="flex-1 pt-1 text-base font-medium text-secondary-800 dark:text-secondary-100">
            {text}
          </Text>
        </View>

        {loading && variant !== "correct" && variant !== "wrong" && (
          <ActivityIndicator size="small" color="#2563eb" className="pt-0.5" />
        )}

        {(variant === "correct" || variant === "wrong") && (
          <View className="flex-row shrink-0 items-center gap-2 pt-0.5">
            <View
              className={`rounded-full border px-3 py-1 ${
                variant === "correct" ? "border-green-300" : "border-red-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  variant === "correct" ? "text-green-600" : "text-red-600"
                }`}
              >
                {variant === "correct" ? correctLabel : yourLabel}
              </Text>
            </View>
            <MaterialIcons
              name={variant === "correct" ? "check-circle" : "cancel"}
              size={24}
              color={variant === "correct" ? "#22c55e" : "#ef4444"}
            />
          </View>
        )}
      </View>

      {!!explanation && (variant === "correct" || variant === "wrong") && (
        <Text className="mt-2 pl-11 text-sm text-secondary-500 dark:text-secondary-400">
          {explanation}
        </Text>
      )}
    </TouchableOpacity>
  );
}
