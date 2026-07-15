import TestIntroHeader from "@/components/intro-header";
import { TestCard } from "@/components/today/test-card";
import { Difficulty } from "@/data/mockTests";
import { getQuestionsByTestId, getTests } from "@/services/testService";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLUMN_GAP = 12;
const PADDING = 16;

const difficultyLabel: Record<Difficulty, string> = {
  easy: "Easy",
  hard: "Hard",
  hardest: "Hardest",
};

export default function SeeAllScreen() {
  const { difficulty } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const tests = getTests(vehicleType, difficulty);
  const { testResults } = useProgressStore();

  const getResult = (id: string, passingScore = 80): "passed" | "failed" | undefined => {
    const r = testResults[id];
    if (!r) return undefined;
    return r.score >= passingScore ? "passed" : "failed";
  };

  const handlePress = (id: string, locked?: boolean, passingScore = 80) => {
    if (locked) { router.push("/premium"); return; }
    const r = testResults[id];
    if (r) {
      const total = getQuestionsByTestId(id).length;
      const correct = Math.round((r.score / 100) * total);
      router.push({ pathname: "/test/results/[id]", params: { id, correct: String(correct), total: String(total), missedIds: r.missedIds ?? "" } });
      return;
    }
    router.push(`/test/${id}`);
  };
  const { width } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;

  const cardWidth = (width - PADDING * 2 - COLUMN_GAP) / 2;

  return (
    <SafeAreaView
      className="flex-1 bg-white-off dark:bg-secondary-900"
      edges={["top", "bottom"]}
    >
      <TestIntroHeader
        backUrl={() => router.back()}
        title={difficultyLabel[difficulty]}
        description={`${tests.length} Tests`}
        scrollY={scrollY}
      />

      <Animated.FlatList
        data={tests}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{
          paddingTop: 155,
          paddingBottom: 24,
          paddingHorizontal: PADDING,
          gap: COLUMN_GAP,
        }}
        columnWrapperStyle={{ gap: COLUMN_GAP }}
        renderItem={({ item, index }) => (
          <View style={{ width: cardWidth }}>
            <TestCard
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              locked={item.locked}
              result={getResult(item.id, item.passingScore)}
              showContinue={index === 0 && !item.locked && !testResults[item.id]}
              gridStyle
              onPress={() => handlePress(item.id, item.locked, item.passingScore)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
