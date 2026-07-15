import { Button } from "@/components/ui/button";
import { DonutChart } from "@/components/ui/donut-chart";
import { Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { getNextTest, getTestById } from "@/services/testService";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import { useProgressStore } from "@/store/progressStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResultsScreen() {
  const { id, correct, total, missedIds, fromQuiz } = useLocalSearchParams<{
    id: string;
    correct: string;
    total: string;
    missedIds?: string;
    fromQuiz?: string;
  }>();
  const router = useRouter();
  const isDark = useIsDark();
  const test = getTestById(id);
  const recordTestResult = useProgressStore((s) => s.recordTestResult);
  const addMissedQuestions = useChallengeBankStore((s) => s.addMissedQuestions);

  const correctCount = Number(correct ?? 0);
  const totalCount = Number(total ?? 0);
  const incorrectCount = totalCount - correctCount;
  const percentage =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const passed = test ? percentage >= test.passingScore : percentage >= 80;
  const nextTest = getNextTest(id);
  const iconColor = isDark ? Secondary[100] : Secondary[700];

  useEffect(() => {
    if (fromQuiz !== "true") return;
    recordTestResult(id, percentage, missedIds ?? "");
    if (missedIds) {
      const ids = missedIds.split(",").filter(Boolean);
      if (ids.length > 0) addMissedQuestions(ids);
    }
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-secondary-900 px-4"
      edges={["top", "bottom"]}
    >
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.7}
        className="w-9 h-9 items-center justify-center mt-2 -ms-4"
      >
        <MaterialIcons name="chevron-left" size={40} color={iconColor} />
      </TouchableOpacity>

      {/* Donut chart */}
      <View className="items-center mt-8 mb-10">
        <DonutChart
          percentage={percentage}
          correct={correctCount}
          incorrect={incorrectCount}
        />
      </View>

      {/* Result title + character */}
      <View className="flex-row items-start mb-8">
        <View className="flex-1 pr-4">
          <Text className="text-4xl font-black text-secondary-900 dark:text-secondary-50 leading-tight mb-3">
            {passed ? "Well Done!\nYou Passed!" : "Not Enough\nTo Pass"}
          </Text>
          <Text className="text-base text-secondary-500 dark:text-secondary-400 leading-relaxed">
            {passed
              ? "Congratulations! You scored high enough to pass. Keep up the great work and you'll ace the official exam."
              : "Ouch! While you were on a roll there for a few questions, you didn't pass this time. But I know this test, and I think you'll pass next time. Really."}
          </Text>
        </View>
        <Text style={{ fontSize: 72 }}>{passed ? "🎉" : "👮‍♂️"}</Text>
      </View>

      <View className="flex-1" />

      {/* Review + Restart */}
      <View className="flex-row gap-3 mb-3 justify-stretch">
        <Button
          variant="secondary"
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
          variant="outline"
          className="flex-1"
          onPress={() => router.replace(`/test/quiz/${id}` as any)}
        >
          Restart
        </Button>
      </View>

      {/* Continue button */}
      <Button
        onPress={() =>
          nextTest
            ? router.replace(`/test/${nextTest.id}` as any)
            : router.replace("/(tabs)" as any)
        }
      >
        {nextTest ? "Continue to the next test" : "Back to Home"}
      </Button>

      {/* Missed questions link */}
      {incorrectCount > 0 && (
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/challange-bank" as any)}
          activeOpacity={0.7}
          className="items-center py-3"
        >
          <Text className="text-sm text-secondary-500 dark:text-secondary-400">
            Or work on your {incorrectCount} missed questions{" "}
            <Text className="text-secondary-700 dark:text-secondary-300">
              ›
            </Text>
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
