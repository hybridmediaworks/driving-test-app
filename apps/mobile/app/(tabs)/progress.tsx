import Header from "@/components/header";
import { ProgressBar } from "@/components/progress/progress-bar";
import { ProgressItem } from "@/components/progress/progress-item";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PROGRESS_ITEMS } from "@/data/progressItems";
import { useAsync } from "@/hooks/use-async";
import { openManual } from "@/lib/handbook";
import { fetchProgressSummary } from "@/services/api/progressService";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgressScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const stateCode = useUserStore((s) => s.state) ?? "CA";
  // Marathon + Exam are premium features — non-premium (incl. signed-out) users are routed to the
  // paywall instead of into the quiz.
  const isPremium = useAuthStore((s) => s.user?.entitlement?.is_premium) ?? false;

  const manualRead = useProgressStore((s) => s.manualRead);
  const setManualRead = useProgressStore((s) => s.setManualRead);
  const testResults = useProgressStore((s) => s.testResults);
  const [openingManual, setOpeningManual] = useState(false);

  const handleOpenManual = async () => {
    if (openingManual) return;
    setOpeningManual(true);
    try {
      await openManual(vehicleType, stateCode);
    } finally {
      setOpeningManual(false);
    }
  };

  // Works signed-in or out: server per-user data (when a token is attached) is merged with locally
  // recorded results, so a guest still sees the tests they've taken. Refetches on focus so numbers
  // update right after taking a test; surfaces a retryable error state if the load fails.
  const { status, data: summary, refetch } = useAsync(
    () => fetchProgressSummary(vehicleType, stateCode, testResults),
    [vehicleType, stateCode],
    { refetchOnFocus: true },
  );

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
        // Premium feature — send non-premium users to the paywall.
        if (!isPremium) return () => router.push("/premium");
        return summary?.marathonQuizId
          ? () => router.push(`/test/quiz/${summary.marathonQuizId}`)
          : undefined;
      case "challenge":
        return () => router.push("/(tabs)/challange-bank");
      case "exam":
        // Premium feature — send non-premium users to the paywall.
        if (!isPremium) return () => router.push("/premium");
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

  // Overall completion. Reading the manual is a fixed 15% of readiness (checking it alone fills the
  // bar to 15%); the remaining 85% fills as the other units — each practice test passed, each
  // marathon completed, and the exam passed — are finished, over the total available.
  const MANUAL_WEIGHT = 15;
  const otherTotal =
    (summary?.practiceTotal ?? 0) +
    (summary?.marathonTotal ?? 0) +
    (summary?.examTotal ?? 0);
  const otherDone =
    (summary?.practicePassed ?? 0) +
    (summary?.marathonCompleted ?? 0) +
    (summary?.examPassed ?? 0);
  const otherPercent = otherTotal > 0 ? (otherDone / otherTotal) * (100 - MANUAL_WEIGHT) : 0;
  const completionPercent = Math.round((manualRead ? MANUAL_WEIGHT : 0) + otherPercent);

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
                onGet={item.id === "manual" ? handleOpenManual : undefined}
                getLoading={item.id === "manual" ? openingManual : undefined}
                locked={(item.id === "marathon" || item.id === "exam") && !isPremium}
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
