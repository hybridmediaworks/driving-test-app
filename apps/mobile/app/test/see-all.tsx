import TestIntroHeader from "@/components/intro-header";
import { TestCard } from "@/components/today/test-card";
import { Primary } from "@/constants/theme";
import { fetchTestsByCategory, TodayTestCard } from "@/services/api/todayService";
import { getQuestionsByTestId } from "@/services/testService";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLUMN_GAP = 12;
const PADDING = 16;

export default function SeeAllScreen() {
  const { category, title } = useLocalSearchParams<{ category: string; title?: string }>();
  const router = useRouter();
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const stateCode = useUserStore((s) => s.state) ?? "CA";
  const { testResults } = useProgressStore();

  const [tests, setTests] = useState<TodayTestCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTestsByCategory(vehicleType, stateCode, category).then((result) => {
      if (!cancelled) {
        setTests(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vehicleType, stateCode, category]);

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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white-off dark:bg-secondary-900 items-center justify-center">
        <ActivityIndicator size="large" color={Primary.DEFAULT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white-off dark:bg-secondary-900"
      edges={["top", "bottom"]}
    >
      <TestIntroHeader
        backUrl={() => router.back()}
        title={title ?? "Tests"}
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
