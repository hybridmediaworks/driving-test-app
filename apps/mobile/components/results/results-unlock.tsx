import { Button } from "@/components/ui/button";
import { Primary } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FEATURES = [
  "500+ exam-like questions",
  "Practice weak topics",
  "Unlimited exam simulations",
  "Pass Guarantee",
];

// Learner photos (shared with the web app's social-proof row).
const AVATARS = [
  require("@/assets/images/avatars/avatar.png"),
  require("@/assets/images/avatars/avatar2.png"),
  require("@/assets/images/avatars/avatar3.png"),
  require("@/assets/images/avatars/avatar4.png"),
  require("@/assets/images/avatars/avatar5.png"),
  require("@/assets/images/avatars/avatar6.png"),
];

/**
 * Post-quiz paywall shown to non-premium learners the moment a test is finished, before the basic
 * results. "Unlock full prep" opens the premium modal (returning lands back here); "See basic
 * results" reveals the real results screen behind it.
 */
export function ResultsUnlock({ onSeeResults }: { onSeeResults: () => void }) {
  const router = useRouter();

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-secondary-900 px-6"
      edges={["top", "bottom"]}
    >
      <View className="flex-1">
        {/* Badge */}
        <View className="items-center mt-4">
          <View className="border border-secondary-200 dark:border-secondary-700 rounded-full px-4 py-2">
            <Text className="text-sm font-semibold text-secondary-900 dark:text-secondary-50">
              Your test results are ready
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-center text-4xl font-black text-secondary-900 dark:text-secondary-50 leading-tight mt-6">
          One free test is just a slice of the DMV exam
        </Text>

        {/* Subtitle */}
        <Text className="text-center text-base text-secondary-500 dark:text-secondary-400 leading-relaxed mt-4">
          Unlock full DMV prep with{" "}
          <Text className="font-bold text-secondary-700 dark:text-secondary-200">
            500+ exam-like questions
          </Text>
          , unlimited exam simulations, and Pass Guarantee.
        </Text>

        {/* Free vs full comparison */}
        <View className="mt-8">
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-secondary-500 dark:text-secondary-400">Free test</Text>
            <Text className="text-base font-bold text-secondary-900 dark:text-secondary-50">
              Full DMV prep
            </Text>
          </View>
          <View className="h-2.5 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: "8%", backgroundColor: Primary.DEFAULT }}
            />
          </View>
        </View>

        {/* Feature chips */}
        <View className="flex-row flex-wrap gap-2 mt-6">
          {FEATURES.map((f) => (
            <View
              key={f}
              className="flex-row items-center gap-1.5 bg-green-100 dark:bg-green-900/20 rounded-full px-3 py-2"
            >
              <MaterialIcons name="check" size={16} color="#16a34a" />
              <Text className="text-sm font-medium text-green-800 dark:text-green-300">{f}</Text>
            </View>
          ))}
        </View>

        <View className="flex-1" />

        {/* Social proof */}
        <View className="items-center mb-2">
          <View className="flex-row mb-2">
            {AVATARS.map((src, i) => (
              <Image
                key={i}
                source={src}
                className={`h-9 w-9 rounded-full border-2 border-white dark:border-secondary-900 ${
                  i > 0 ? "-ml-2" : ""
                }`}
              />
            ))}
          </View>
          <Text className="text-sm text-secondary-500 dark:text-secondary-400">
            97% pass rate | Trusted by 9M learners
          </Text>
        </View>
      </View>

      {/* CTA */}
      <Button showArrow onPress={() => router.push("/premium")}>
        Unlock full prep (3 days free)
      </Button>
      <TouchableOpacity onPress={onSeeResults} activeOpacity={0.7} className="items-center py-4">
        <Text className="text-base font-semibold text-primary">See basic results</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
