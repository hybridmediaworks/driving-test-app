import TestIntroHeader from "@/components/intro-header";
import { TestCard } from "@/components/today/test-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAsync } from "@/hooks/use-async";
import { fetchTestsByCategory } from "@/services/api/todayService";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLUMN_GAP = 12;
const PADDING = 16;

export default function SeeAllScreen() {
  const { category, title } = useLocalSearchParams<{ category: string; title?: string }>();
  const router = useRouter();
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const stateCode = useUserStore((s) => s.state) ?? "CA";
  const { testResults } = useProgressStore();
  // Re-fetch when auth identity / premium status changes so lock icons reflect the current user
  // (see the Today screen for the same fix).
  const authKey = useAuthStore((s) => s.user?.id);
  const isPremium = useAuthStore((s) => s.user?.entitlement?.is_premium);

  const { status, data, refetch } = useAsync(
    () => fetchTestsByCategory(vehicleType, stateCode, category),
    [vehicleType, stateCode, category, authKey, isPremium],
  );
  const tests = data ?? [];

  const getResult = (id: string, passingScore = 80): "passed" | "failed" | undefined => {
    const r = testResults[id];
    if (!r) return undefined;
    return r.score >= passingScore ? "passed" : "failed";
  };

  const handlePress = (id: string, locked?: boolean) => {
    if (locked) { router.push("/premium"); return; }
    router.push(`/test/quiz/${id}`);
  };
  const { width } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;

  const cardWidth = (width - PADDING * 2 - COLUMN_GAP) / 2;

  // Same rule as the Today tab: "Continue" goes on the first unlocked, not-yet-completed test —
  // not just index 0 — so it moves on once the current one is finished.
  const continueId = tests.find((t) => !t.locked && !testResults[t.id])?.id;

  if (status === "loading") {
    return (
      <SafeAreaView
        className="flex-1 bg-white-off dark:bg-secondary-900"
        edges={["top", "bottom"]}
      >
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView
        className="flex-1 bg-white-off dark:bg-secondary-900"
        edges={["top", "bottom"]}
      >
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (tests.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-white-off dark:bg-secondary-900"
        edges={["top", "bottom"]}
      >
        <TestIntroHeader
          backUrl={() => router.back()}
          title={title ?? "Tests"}
          description="0 Tests"
          scrollY={scrollY}
        />
        <EmptyState
          icon="list-alt"
          title="No tests here yet"
          message="There are no tests in this category for your vehicle and state yet."
        />
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
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <TestCard
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              locked={item.locked}
              result={getResult(item.id, item.passingScore)}
              showContinue={item.id === continueId}
              gridStyle
              onPress={() => handlePress(item.id, item.locked)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
