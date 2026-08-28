import { Alert, Animated, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/header";
import { ExamCard } from "@/components/today/exam-card";
import { FeedbackCard } from "@/components/today/feedback-card";
import { HeroCard } from "@/components/today/hero-card";
import { PromoCard } from "@/components/today/promo-card";
import { TestsRow } from "@/components/today/tests-row";
import { TheorySection } from "@/components/today/theory-section";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Heading } from "@/components/ui/heading";
import { LoadingState } from "@/components/ui/loading-state";
import { useAsync } from "@/hooks/use-async";
import { requestAppRating } from "@/lib/appRating";
import { openCheatSheetPdf } from "@/lib/cheatSheets";
import { reportAnIssue } from "@/lib/support";
import {
  fetchTodayData,
  pickHeroTest,
  TodayData,
  TodayTestCard,
} from "@/services/api/todayService";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { router } from "expo-router";
import { useMemo, useRef } from "react";

const EMPTY_DATA: TodayData = {
  testRows: [],
  theoryItems: [],
  examCard: null,
};

export default function TodayScreen() {
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const stateCode = useUserStore((s) => s.state) ?? "CA";
  const { testResults } = useProgressStore();

  const { status, data, refetch } = useAsync(
    () => fetchTodayData(vehicleType, stateCode),
    [vehicleType, stateCode],
  );

  const { testRows, theoryItems, examCard } = data ?? EMPTY_DATA;

  const allCards: Record<string, TodayTestCard> = {};
  testRows.forEach((row) => row.tests.forEach((t) => {
    allCards[t.id] = t;
  }));

  const completedIds = useMemo(() => new Set(Object.keys(testResults)), [testResults]);
  const heroTest = pickHeroTest(testRows, completedIds);

  // "Continue" goes on the first test in the row that's still unlocked and not yet completed —
  // not just index 0, so it moves on to the next test once the current one is finished, same
  // idea as the hero card's "next test" pick.
  const withResult = (tests: TodayTestCard[]) => {
    const continueId = tests.find((t) => !t.locked && !testResults[t.id])?.id;
    return tests.map((t) => {
      const r = testResults[t.id];
      const showContinue = t.id === continueId;
      if (!r) return { ...t, showContinue };
      const passed = r.score >= t.passingScore;
      return { ...t, showContinue, result: passed ? "passed" : "failed" } as typeof t & {
        showContinue: boolean;
        result: "passed" | "failed";
      };
    });
  };
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleTestPress = (id: string) => {
    if (allCards[id]?.locked) {
      router.push("/premium");
      return;
    }
    router.push(`/test/quiz/${id}`);
  };

  if (status === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900" edges={["top"]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900" edges={["top"]}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  // Loaded successfully, but there's genuinely nothing to show for this vehicle/state.
  if (testRows.length === 0 && !examCard && theoryItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900" edges={["top"]}>
        <Header title="Today" subtitle="DMV Genie" scrollY={scrollY} avatar whiteBackground />
        <EmptyState
          icon="fact-check"
          title="Nothing here yet"
          message="We couldn't find any tests for your vehicle and state yet. Check back soon or refresh."
          actionLabel="Refresh"
          onAction={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-secondary-900"
      edges={["top"]}
    >
      <Header
        title="Today"
        subtitle="DMV Genie"
        scrollY={scrollY}
        avatar
        whiteBackground
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 111,
          paddingBottom: 24,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* Hero — Take Me Next */}
        {heroTest && (
          <View className="mb-6 mt-2">
            <HeroCard
              title={heroTest.title}
              description={heroTest.description}
              image={heroTest.image}
              onPress={() => router.push(`/test/quiz/${heroTest.testId}`)}
            />
          </View>
        )}

        {/* Tests — one row per category the backend returns for this vehicle/state, in the
            backend's own display order. Adding or removing a category server-side changes what
            shows up here with no app changes needed. */}
        {testRows.length > 0 && (
          <>
            <View className="px-4 mb-3">
              <Heading level="h2">Tests</Heading>
            </View>

            {testRows.map((row, index) => (
              <View key={row.category || row.title}>
                <TestsRow
                  title={row.title}
                  badge={row.badge}
                  tests={withResult(row.tests)}
                  onSeeAll={() =>
                    router.push({
                      pathname: "/test/see-all",
                      params: { category: row.category, title: row.title },
                    })
                  }
                  onTestPress={handleTestPress}
                />
                {index === 0 && (
                  <PromoCard
                    title="Pass the first time"
                    subtitle="Unlock all exam-like questions"
                    previewImage={row.tests[1]?.image ?? row.tests[0]?.image}
                    onPress={() => router.push("/premium")}
                  />
                )}
              </View>
            ))}
          </>
        )}

        {/* Theory */}
        {theoryItems.length > 0 && (
          <>
            <View className="px-4 mb-3">
              <Heading level="h2">Theory</Heading>
            </View>
            <TheorySection
              title="Cheat sheet"
              badge={`${theoryItems.length} PDF`}
              items={theoryItems.slice(0, 3)}
              onSeeAll={() => router.push("/theory/see-all")}
              onItemPress={(id) => {
                const item = theoryItems.find((t) => t.id === id);
                if (item?.action === "unlock") {
                  router.push("/premium");
                } else {
                  openCheatSheetPdf(id);
                }
              }}
            />
          </>
        )}

        {/* Exam */}
        {examCard && (
          <>
            <View className="px-4 mb-3">
              <Heading level="h2">Exam</Heading>
            </View>
            <ExamCard
              title={examCard.title}
              subtitle={examCard.subtitle}
              image={examCard.image}
              progress={`0 / ${examCard.totalQuestions}`}
              locked={examCard.locked}
              onPress={() =>
                examCard.locked
                  ? router.push("/premium")
                  : router.push(`/test/quiz/${examCard.id}`)
              }
            />
          </>
        )}

        {/* Feedback */}
        <FeedbackCard
          question="Enjoying DMV Genie?"
          onYes={() =>
            Alert.alert(
              "Awesome!",
              "Could you please leave a Google Play review? It really helps a lot.",
              [
                { text: "No", style: "cancel" },
                { text: "Yes", onPress: () => requestAppRating() },
              ],
            )
          }
          onNo={() =>
            Alert.alert(
              "Oh no!",
              "Could you email us to let us know what you don't like, or if you are having a problem? We love feedback and would love to help.",
              [
                { text: "No", style: "cancel" },
                { text: "Yes", onPress: () => reportAnIssue() },
              ],
            )
          }
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
