import Header from "@/components/header";
import { ProgressBar } from "@/components/progress/progress-bar";
import { ProgressItem } from "@/components/progress/progress-item";
import { PROGRESS_ITEMS } from "@/data/progressItems";
import { getExamConfig, getQuestionsByTestId, getTests } from "@/services/testService";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgressScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [manualChecked, setManualChecked] = useState(false);
  const { completedTestIds, testResults } = useProgressStore();
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const allPracticeTests = [
    ...getTests(vehicleType, "easy"),
    ...getTests(vehicleType, "hard"),
    ...getTests(vehicleType, "hardest"),
  ];
  const examConfig = getExamConfig(vehicleType);

  const handlePracticePress = () => {
    const submitted = allPracticeTests
      .filter((t) => testResults[t.id])
      .sort((a, b) =>
        new Date(testResults[b.id].completedAt).getTime() -
        new Date(testResults[a.id].completedAt).getTime()
      );

    if (submitted.length > 0) {
      const latest = submitted[0];
      const r = testResults[latest.id];
      const total = getQuestionsByTestId(latest.id).length;
      const correct = Math.round((r.score / 100) * total);
      router.push({
        pathname: "/test/results/[id]",
        params: { id: latest.id, correct: String(correct), total: String(total), missedIds: r.missedIds ?? "" },
      } as any);
    } else {
      const first = allPracticeTests[0];
      if (first) router.push(`/test/${first.id}` as any);
    }
  };

  const progressPercent = Math.min(
    Math.round((completedTestIds.length / 7) * 100) + (manualChecked ? 15 : 0),
    100,
  );

  return (
    <SafeAreaView
      className="flex-1 bg-white-off dark:bg-secondary-900"
      edges={["top"]}
    >
      <Header
        title="Your Progress"
        scrollY={scrollY}
        backgroundImage="https://images.pexels.com/photos/1687093/pexels-photo-1687093.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop"
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{
          paddingTop: 305,
          paddingBottom: 40,
          paddingInline: 16,
        }}
      >
        {/* Description */}
        <View className="pb-4 gap-5">
          <Text className="text-secondary-500 dark:text-secondary-400 text-base">
            Based on your account activity, we believe these are your chances of
            passing the official exam if you took it today. Score of 80% or
            higher is required.
          </Text>
          <ProgressBar percent={progressPercent} />
        </View>

        {/* Progress items */}
        <View>
          {PROGRESS_ITEMS.map((item, index) => (
            <ProgressItem
              key={item.id}
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              type={item.type}
              checked={item.id === "manual" ? manualChecked : undefined}
              onCheckChange={
                item.id === "manual" ? setManualChecked : undefined
              }
              onPress={
                item.id === "practice"
                  ? handlePracticePress
                  : item.id === "exam"
                    ? () => router.push(`/test/${examConfig.id}` as any)
                    : item.href
                      ? () => router.push(item.href as any)
                      : undefined
              }
              isLast={index === PROGRESS_ITEMS.length - 1}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
