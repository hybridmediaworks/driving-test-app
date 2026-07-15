import { Animated, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/header";
import { ExamCard } from "@/components/today/exam-card";
import { FeedbackCard } from "@/components/today/feedback-card";
import { HeroCard } from "@/components/today/hero-card";
import { PromoCard } from "@/components/today/promo-card";
import { TestsRow } from "@/components/today/tests-row";
import { TheorySection } from "@/components/today/theory-section";
import { Heading } from "@/components/ui/heading";
import {
  getExamConfig,
  getHeroTest,
  getQuestionsByTestId,
  getTestById,
  getTests,
  getTheoryItems,
} from "@/services/testService";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { router } from "expo-router";
import { useRef } from "react";

export default function TodayScreen() {
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const easyTests = getTests(vehicleType, "easy");
  const hardTests = getTests(vehicleType, "hard");
  const hardestTests = getTests(vehicleType, "hardest");
  const heroTest = getHeroTest(vehicleType);
  const theoryItems = getTheoryItems(vehicleType);
  const examConfig = getExamConfig(vehicleType);
  const { testResults } = useProgressStore();

  const withResult = (tests: typeof easyTests) =>
    tests.map((t) => {
      const r = testResults[t.id];
      if (!r) return t;
      const passed = r.score >= (t.passingScore ?? 80);
      return { ...t, result: passed ? "passed" : "failed" } as typeof t & { result: "passed" | "failed" };
    });
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleTestPress = (id: string) => {
    const test = getTestById(id);
    if (test?.locked) {
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
        <View className="mb-6 mt-2">
          <HeroCard
            title={heroTest.title}
            description={heroTest.description}
            image={heroTest.image}
            onPress={() => router.push(`/test/${heroTest.testId}`)}
          />
        </View>

        {/* Tests */}
        <View className="px-4 mb-3">
          <Heading level="h2">Tests</Heading>
        </View>

        <TestsRow
          title="Easy"
          badge="Step 1"
          tests={withResult(easyTests)}
          onSeeAll={() => router.push("/test/see-all?difficulty=easy")}
          onTestPress={handleTestPress}
        />

        <TestsRow
          title="Hard"
          badge="Step 2"
          tests={withResult(hardTests)}
          onSeeAll={() => router.push("/test/see-all?difficulty=hard")}
          onTestPress={handleTestPress}
        />

        <PromoCard
          title="Pass the first time"
          subtitle="Unlock all exam-like questions"
          previewImage={easyTests[1]?.image ?? easyTests[0]?.image}
          onPress={() => router.push("/premium")}
        />

        <TestsRow
          title="Hardest"
          badge="Step 3"
          tests={withResult(hardestTests)}
          onSeeAll={() => router.push("/test/see-all?difficulty=hardest")}
          onTestPress={handleTestPress}
        />

        {/* Theory */}
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

        {/* Exam */}
        <View className="px-4 mb-3">
          <Heading level="h2">Exam</Heading>
        </View>
        <ExamCard
          title={examConfig.title}
          subtitle={examConfig.subtitle}
          image={examConfig.image}
          progress={`0 / ${examConfig.totalSimulations}`}
          onPress={() => router.push(`/test/${examConfig.id}`)}
        />

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
