import IntroHeader from "@/components/intro-header";
import { TheoryCard } from "@/components/today/theory-card";
import { Button } from "@/components/ui/button";
import { useIsDark } from "@/hooks/use-is-dark";
import { getTheoryItems } from "@/services/testService";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUBTITLE =
  "These quick guides cover the trickiest questions you're likely to see on the real exam. You'll know what to expect on the big day!";

export default function TheorySeeAllScreen() {
  const router = useRouter();
  const isDark = useIsDark();
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const items = getTheoryItems(vehicleType);
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView
      className="flex-1 bg-white-off dark:bg-secondary-900"
      edges={["top", "bottom"]}
    >
      <IntroHeader
        backUrl={() => router.back()}
        title="Theory"
        description={`${items.length} PDFs`}
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

        {/* Theory cards */}
        {items.map((item) => (
          <TheoryCard
            key={item.id}
            title={item.title}
            description={item.description}
            fileInfo={item.fileInfo}
            locked={item.action === "unlock"}
            onPress={() =>
              item.action === "unlock"
                ? router.push("/premium")
                : console.log("theory item pressed:", item.id)
            }
          />
        ))}
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
