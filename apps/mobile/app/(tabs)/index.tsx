import { ActivityIndicator, Animated, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/header";
import { ExamCard } from "@/components/today/exam-card";
import { FeedbackCard } from "@/components/today/feedback-card";
import { HeroCard } from "@/components/today/hero-card";
import { PromoCard } from "@/components/today/promo-card";
import { TestsRow } from "@/components/today/tests-row";
import { TheorySection } from "@/components/today/theory-section";
import { Heading } from "@/components/ui/heading";
import { Primary } from "@/constants/theme";
import {
  fetchTodayData,
  pickHeroTest,
  TodayData,
  TodayTestCard,
} from "@/services/api/todayService";
import { getQuestionsByTestId } from "@/services/testService";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_DATA: TodayData = {
  testRows: [],
  theoryItems: [],
  examCard: null,
};

export default function TodayScreen() {
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const stateCode = useUserStore((s) => s.state) ?? "CA";
  const { testResults } = useProgressStore();

  const [data, setData] = useState<TodayData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTodayData(vehicleType, stateCode).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vehicleType, stateCode]);

  const { testRows, theoryItems, examCard } = data;

  const allCards: Record<string, TodayTestCard> = {};
  testRows.forEach((row) => row.tests.forEach((t) => {
    allCards[t.id] = t;
  }));

  const completedIds = useMemo(() => new Set(Object.keys(testResults)), [testResults]);
  const heroTest = pickHeroTest(testRows, completedIds);

  // Same "Continue" rule as test/see-all.tsx: only the row's first card, and only when it's
  // still unlocked and untouched — once it has a result, the passed/failed badge takes over.
  const withResult = (tests: TodayTestCard[]) =>
    tests.map((t, index) => {
      const r = testResults[t.id];
      const showContinue = index === 0 && !t.locked && !r;
      if (!r) return { ...t, showContinue };
      const passed = r.score >= t.passingScore;
      return { ...t, showContinue, result: passed ? "passed" : "failed" } as typeof t & {
        showContinue: boolean;
        result: "passed" | "failed";
      };
    });
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleTestPress = (id: string) => {
    if (allCards[id]?.locked) {
      router.push("/premium");
      return;
    }
    if (testResults[id]) {
      const questions = getQuestionsByTestId(id);
      const total = questions.length;
      const r = testResults[id];
      const correct = Math.round((r.score / 100) * total);
      router.push({
        pathname: "/test/results/[id]",
        params: { id, correct: String(correct), total: String(total), missedIds: r.missedIds ?? "" },
      });
      return;
    }
    router.push(`/test/${id}`);
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={Primary.DEFAULT} />
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
              onPress={() => router.push(`/test/${heroTest.testId}`)}
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
                if (item?.action === "unlock") router.push("/premium");
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
                examCard.locked ? router.push("/premium") : router.push(`/test/${examCard.id}`)
              }
            />
          </>
        )}

        {/* Feedback */}
        <FeedbackCard
          question="Enjoying DMV Genie?"
          onYes={() => {}}
          onNo={() => {}}
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
