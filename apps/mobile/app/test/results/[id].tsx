import { ResultsUnlock } from "@/components/results/results-unlock";
import { Button } from "@/components/ui/button";
import { Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { fetchNextTest, fetchTestDetail } from "@/services/api/todayService";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResultsScreen() {
  const { id, correct, total, missedIds, fromQuiz, passed: passedParam } = useLocalSearchParams<{
    id: string;
    correct: string;
    total: string;
    missedIds?: string;
    fromQuiz?: string;
    passed?: string;
  }>();
  const router = useRouter();
  const isDark = useIsDark();
  const recordTestResult = useProgressStore((s) => s.recordTestResult);
  // Free learners see an upsell paywall the moment they finish a test (fromQuiz), before the basic
  // results. Premium users, and revisits of an old result, go straight to the results.
  const isPremium = useAuthStore((s) => s.user?.entitlement?.is_premium) ?? false;
  const [showBasicResults, setShowBasicResults] = useState(false);

  // Passing score powers both the pass/fail verdict (when not passed via route param) and the score
  // bar's "Passing score" marker, so it's always fetched. Next test drives the "Next test" button.
  const [apiPassingScore, setApiPassingScore] = useState<number | undefined>(undefined);
  const [apiNextTestId, setApiNextTestId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchTestDetail(id).then((d) => {
      if (!cancelled) setApiPassingScore(d.passingScore);
    });
    fetchNextTest(id).then((t) => {
      if (!cancelled) setApiNextTestId(t?.id);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const correctCount = Number(correct ?? 0);
  const totalCount = Number(total ?? 0);
  const incorrectCount = totalCount - correctCount;
  const percentage =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const passed =
    passedParam !== undefined
      ? passedParam === "true"
      : percentage >= (apiPassingScore ?? 80);
  const nextTestId = apiNextTestId;
  const passingScorePercent = apiPassingScore ?? 80;
  const iconColor = isDark ? Secondary[100] : Secondary[700];

  useEffect(() => {
    if (fromQuiz !== "true") return;
    recordTestResult(id, percentage, missedIds ?? "");
    // Wrong answers are filed into the Challenge Bank server-side by the grader (see
    // GradeQuizAttempt) when the attempt is submitted — no client-side add needed here.
  }, []);

  // Paywall gate — only right after finishing a test, and only for non-premium learners.
  if (fromQuiz === "true" && !isPremium && !showBasicResults) {
    return <ResultsUnlock onSeeResults={() => setShowBasicResults(true)} />;
  }

  const scoreFill = passed ? "#22c55e" : "#f87171";
  // Keep the score/marker labels from getting cramped at very low percentages.
  const scoreLabelWidth = Math.min(Math.max(percentage, 20), 92);
  const passLabelWidth = Math.min(Math.max(passingScorePercent, 20), 92);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-secondary-900 px-5"
      edges={["top", "bottom"]}
    >
      {/* Header: close + Restart */}
      <View className="flex-row items-center justify-between mt-1">
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)" as any)}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full items-center justify-center bg-secondary-100 dark:bg-secondary-800"
        >
          <MaterialIcons name="close" size={22} color={iconColor} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace(`/test/quiz/${id}` as any)}
          activeOpacity={0.7}
          className="px-4 py-2 rounded-full bg-secondary-100 dark:bg-secondary-800"
        >
          <Text className="text-base font-semibold text-primary">Restart</Text>
        </TouchableOpacity>
      </View>

      {/* Character card */}
      <View
        className="mt-4 rounded-3xl bg-primary-50 dark:bg-secondary-800 items-center justify-center"
        style={{ height: 240 }}
      >
        <Text style={{ fontSize: 128 }}>{passed ? "🎉" : "👮‍♂️"}</Text>
      </View>

      {/* Correct / Incorrect */}
      <View className="flex-row items-center justify-center gap-6 mt-5">
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          <Text className="text-base text-secondary-500 dark:text-secondary-400">
            <Text className="font-bold text-secondary-900 dark:text-secondary-50">{correctCount}</Text> Correct
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <Text className="text-base text-secondary-500 dark:text-secondary-400">
            <Text className="font-bold text-secondary-900 dark:text-secondary-50">{incorrectCount}</Text> Incorrect
          </Text>
        </View>
      </View>

      {/* Title + description */}
      <Text className="text-center text-3xl font-black text-secondary-900 dark:text-secondary-50 mt-4">
        {passed ? "You passed!" : "Not enough to pass"}
      </Text>
      <Text className="text-center text-base text-secondary-500 dark:text-secondary-400 leading-relaxed mt-3">
        {passed
          ? "Congratulations! You scored high enough to pass. Keep it up and you'll ace the official exam."
          : "It's not the worst thing that could happen. Let's give this another shot — I think you'll pass next time."}
      </Text>

      {/* Score bar */}
      <View className="mt-8">
        <View style={{ width: `${passLabelWidth}%` }} className="items-end pr-1 mb-1">
          <Text className="text-xs text-secondary-400 dark:text-secondary-500">Passing score</Text>
        </View>
        <View className="relative">
          <View className="h-3 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: scoreFill }}
            />
          </View>
          {/* Passing-score marker */}
          <View
            style={{
              position: "absolute",
              left: `${passingScorePercent}%`,
              top: -4,
              bottom: -4,
              borderLeftWidth: 1.5,
              borderColor: isDark ? Secondary[500] : Secondary[400],
            }}
          />
        </View>
        <View style={{ width: `${scoreLabelWidth}%` }} className="items-end pr-1 mt-1">
          <Text className="text-base font-bold text-secondary-900 dark:text-secondary-50">{percentage}%</Text>
          <Text className="text-xs text-secondary-400 dark:text-secondary-500">Your score</Text>
        </View>
      </View>

      <View className="flex-1" />

      {/* Review + Next test */}
      <View className="flex-row gap-3 mb-2">
        <Button
          variant="outline"
          className="flex-1"
          onPress={() =>
            router.push({
              pathname: "/test/review/[id]",
              params: { id, missedIds: missedIds ?? "" },
            } as any)
          }
        >
          Review
        </Button>
        <Button
          className="flex-1"
          showArrow
          onPress={() =>
            nextTestId
              ? router.replace(`/test/quiz/${nextTestId}` as any)
              : router.replace("/(tabs)" as any)
          }
        >
          {nextTestId ? "Next test" : "Home"}
        </Button>
      </View>

      {/* Missed questions link */}
      {incorrectCount > 0 && (
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/challange-bank" as any)}
          activeOpacity={0.7}
          className="items-center py-3"
        >
          <Text className="text-sm text-secondary-500 dark:text-secondary-400">
            or work on your{" "}
            <Text className="text-primary font-semibold">{incorrectCount} missed questions</Text>
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
