import Header from "@/components/header";
import { ProgressBar } from "@/components/progress/progress-bar";
import { ProgressItem } from "@/components/progress/progress-item";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PROGRESS_ITEMS } from "@/data/progressItems";
import { useAsync } from "@/hooks/use-async";
import { fetchProgressSummary } from "@/services/api/progressService";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { router } from "expo-router";
import { useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgressScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const user = useAuthStore((s) => s.user);
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const stateCode = useUserStore((s) => s.state) ?? "CA";

  const manualRead = useProgressStore((s) => s.manualRead);
  const setManualRead = useProgressStore((s) => s.setManualRead);

  // Refetch every time the tab regains focus, so numbers update right after taking a test. Gated on
  // auth (progress is per-user), and surfaces a retryable error state if the load fails.
  const { status, data: summary, refetch } = useAsync(
    () => fetchProgressSummary(vehicleType, stateCode),
    [vehicleType, stateCode],
    { enabled: !!user, refetchOnFocus: true },
  );

  // ── Not signed in: progress is per-user, so gate on auth ──
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white-off dark:bg-secondary-900" edges={["top"]}>
        <Header title="Your Progress" scrollY={scrollY} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-base text-secondary-500 dark:text-secondary-400">
            Sign in to track your progress and see your chances of passing.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            className="rounded-full bg-primary px-6 py-3"
          >
            <Text className="font-semibold text-white">Log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtitleFor = (id: string): string => {
    switch (id) {
      case "manual":
        return "Please confirm you've read it";
      case "practice":
        return `${summary?.practicePassed ?? 0} of ${summary?.practiceTotal ?? 0} tests passed`;
      case "challenge":
        return `${summary?.challengeBankCount ?? 0} question${
          (summary?.challengeBankCount ?? 0) === 1 ? "" : "s"
        } left`;
      case "marathon":
        return `${summary?.marathonQuestionsAnswered ?? 0} of ${summary?.marathonQuestionsTotal ?? 0} questions completed`;
      case "exam":
        return `${summary?.examPassed ?? 0} of ${summary?.examTotal ?? 0} exam${
          (summary?.examTotal ?? 0) === 1 ? "" : "s"
        } passed`;
      default:
        return "";
    }
  };

  const onPressFor = (id: string): (() => void) | undefined => {
    switch (id) {
      case "practice":
        return summary?.nextPracticeQuizId
          ? () => router.push(`/test/quiz/${summary.nextPracticeQuizId}`)
          : undefined;
      case "marathon":
        return summary?.marathonQuizId
          ? () => router.push(`/test/quiz/${summary.marathonQuizId}`)
          : undefined;
      case "challenge":
        return () => router.push("/(tabs)/challange-bank");
      case "exam":
        return summary?.examQuizId
          ? () =>
              router.push(
                summary.examLocked ? "/premium" : `/test/quiz/${summary.examQuizId}`,
              )
          : undefined;
      default:
        return undefined;
    }
  };

  // Overall completion — every step below is one "unit": reading the manual (1), each practice
  // test passed, each marathon completed, and the exam passed, over the total available. The bar
  // starts near empty and fills as the learner actually finishes things (checking Manual moves it
  // too), rather than reflecting the average-score pass-chance.
  const totalUnits =
    1 +
    (summary?.practiceTotal ?? 0) +
    (summary?.marathonTotal ?? 0) +
    (summary?.examTotal ?? 0);
  const doneUnits =
    (manualRead ? 1 : 0) +
    (summary?.practicePassed ?? 0) +
    (summary?.marathonCompleted ?? 0) +
    (summary?.examPassed ?? 0);
  const completionPercent = totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-white-off dark:bg-secondary-900" edges={["top"]}>
      <Header title="Your Progress" scrollY={scrollY} />

      {status === "loading" && !summary ? (
        <LoadingState />
      ) : status === "error" && !summary ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          contentContainerStyle={{ paddingTop: 111, paddingBottom: 40, paddingInline: 16 }}
        >
          {/* Description + overall completion */}
          <View className="pb-4 gap-5">
            <Text className="text-secondary-500 dark:text-secondary-400 text-base">
              Your overall progress toward being exam-ready. Read the manual, pass the practice
              tests, finish the marathons and pass the exam simulator below — the bar fills as you
              complete each step.
            </Text>
            <ProgressBar percent={completionPercent} />
          </View>

          {/* Progress items */}
          <View>
            {PROGRESS_ITEMS.map((item, index) => (
              <ProgressItem
                key={item.id}
                image={item.image}
                title={item.title}
                subtitle={subtitleFor(item.id)}
                type={item.type}
                checked={item.id === "manual" ? manualRead : undefined}
                onCheckChange={item.id === "manual" ? setManualRead : undefined}
                onPress={onPressFor(item.id)}
                isLast={index === PROGRESS_ITEMS.length - 1}
              />
            ))}
          </View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}
