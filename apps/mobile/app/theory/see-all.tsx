import IntroHeader from "@/components/intro-header";
import { TheoryCard } from "@/components/today/theory-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAsync } from "@/hooks/use-async";
import { openCheatSheetPdf } from "@/lib/cheatSheets";
import { openManual } from "@/lib/handbook";
import { fetchTheoryList } from "@/services/api/todayService";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUBTITLE =
  "These quick guides cover the trickiest questions you're likely to see on the real exam. You'll know what to expect on the big day!";

export default function TheorySeeAllScreen() {
  const router = useRouter();
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const stateCode = useUserStore((s) => s.state) ?? "CA";
  // The cheat sheet currently opening — drives the spinner on its "Read" button.
  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);
  // Re-fetch when auth identity / premium status changes so locked PDFs reflect the current user.
  const authKey = useAuthStore((s) => s.user?.id);
  const isPremium = useAuthStore((s) => s.user?.entitlement?.is_premium);
  const { status, data, refetch } = useAsync(
    () => fetchTheoryList(vehicleType, stateCode),
    [vehicleType, stateCode, authKey, isPremium],
  );
  const items = data ?? [];
  const scrollY = useRef(new Animated.Value(0)).current;

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

  return (
    <SafeAreaView
      className="flex-1 bg-white-off dark:bg-secondary-900"
      edges={["top", "bottom"]}
    >
      <IntroHeader
        backUrl={() => router.back()}
        title="Theory"
        // +1 for the always-present Manual row (a PDF too), so the count matches the rows shown.
        description={`${items.length + 1} PDF${items.length + 1 === 1 ? "" : "s"}`}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{
          paddingTop: 155,
          paddingBottom: 24,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        {/* Subtitle */}
        <Text className="text-base text-secondary-500 dark:text-secondary-400 font-medium leading-6 mb-2">
          {SUBTITLE}
        </Text>

        {/* Manual — always the first row; opens the handbook PDF directly (like the Progress tab). */}
        <TheoryCard
          title="Manual"
          description="Your official state driver's handbook."
          loading={loadingSheetId === "manual"}
          onPress={async () => {
            if (loadingSheetId) return;
            setLoadingSheetId("manual");
            try {
              await openManual(vehicleType, stateCode);
            } finally {
              setLoadingSheetId(null);
            }
          }}
        />

        {/* Cheat sheets */}
        {items.length === 0 ? (
          <Text className="text-sm text-secondary-400 dark:text-secondary-500 mt-1">
            No cheat sheets for your vehicle and state yet — check back soon.
          </Text>
        ) : (
          items.map((item) => (
            <TheoryCard
              key={item.id}
              title={item.title}
              description={item.description}
              locked={item.locked}
              loading={loadingSheetId === item.id}
              onPress={async () => {
                if (item.locked) {
                  router.push("/premium");
                  return;
                }
                if (loadingSheetId) return;
                setLoadingSheetId(item.id);
                try {
                  await openCheatSheetPdf(item.id);
                } finally {
                  setLoadingSheetId(null);
                }
              }}
            />
          ))
        )}
      </Animated.ScrollView>

      {/* Bottom CTA */}
      <View className="px-5 pb-4 pt-3 border-t border-secondary-100 dark:border-secondary-800">
        <Button onPress={() => router.push("/premium")} showArrow={false}>
          Get Premium to unlock
        </Button>
      </View>
    </SafeAreaView>
  );
}
