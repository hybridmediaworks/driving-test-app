import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Secondary } from "@/constants/theme";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import { MaterialIcons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CARD_IMAGE = {
  uri: "https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
};

export default function ChallangeBankScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const { missedQuestionIds } = useChallengeBankStore();

  const missedCount = missedQuestionIds.length;
  const hasQuestions = missedCount > 0;

  const handleStart = () => {
    if (!hasQuestions) return;
    router.push("/test/quiz/challenge-bank");
  };

  const handleSeeAll = () => {
    router.push("/challange-bank/review");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-secondary-900"
      edges={["top"]}
    >
      <Header title="Challenge Bank™" scrollY={scrollY} whiteBackground />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{
          paddingTop: 100,
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
      >
        {/* Description */}
        <Text className="text-lg text-secondary-800 dark:text-secondary-200 mb-2">
          These are question you've missed across all other tests
        </Text>
        <Text className="text-lg text-secondary-500 dark:text-secondary-400 mb-10">
          Think of this as your very own remediation room, where you are able to
          practice the things that are most difficult for you.
        </Text>

        {/* Image Card */}
        <View
          className="h-56 rounded-2xl overflow-hidden mb-4"
          style={{ height: 290 }}
        >
          <ImageBackground
            source={CARD_IMAGE}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            {/* Progress badge */}
            <View className="absolute bottom-3 self-center bg-black/60 rounded-full px-4 py-1">
              <Text className="text-white text-base font-semibold">
                {hasQuestions
                  ? `${missedCount} question${missedCount !== 1 ? "s" : ""}`
                  : "No questions yet"}
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* See all link */}
        <TouchableOpacity
          onPress={handleSeeAll}
          activeOpacity={0.7}
          className="flex-row items-center justify-between py-4"
        >
          <Text className="text-lg text-secondary-900 dark:text-secondary-100">
            See all the missed or marked questions
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={Secondary[400]} />
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Start button */}
      <View className="px-5 pb-4 pt-3">
        <Button showArrow onPress={handleStart} disabled={!hasQuestions}>
          Start
        </Button>
      </View>
    </SafeAreaView>
  );
}
