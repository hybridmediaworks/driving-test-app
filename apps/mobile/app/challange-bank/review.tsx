import IntroHeader from "@/components/intro-header";
import { Secondary } from "@/constants/theme";
import { MOCK_QUESTIONS } from "@/data/mockQuestions";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengeBankReviewScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { missedQuestionIds } = useChallengeBankStore();
  const questions = MOCK_QUESTIONS.filter((q) =>
    missedQuestionIds.includes(q.id),
  );

  const description = `${questions.length} question${questions.length !== 1 ? "s" : ""}`;

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-secondary-900"
      edges={["top", "bottom"]}
    >
      <IntroHeader
        backUrl={() => router.back()}
        title="Review"
        description={description}
        scrollY={scrollY}
        whiteBackground
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{ paddingTop: 140, paddingBottom: 32 }}
      >
        {questions.length === 0 ? (
          <View className="items-center justify-center px-6 py-16">
            <Text className="text-base text-secondary-400 text-center">
              No missed or marked questions yet.
            </Text>
          </View>
        ) : (
          questions.map((q, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/test/quiz/[id]",
                  params: { id: "challenge-bank", initialIndex: String(index) },
                })
              }
              className="border-b border-secondary-200 dark:border-secondary-700"
            >
              <View className="flex-row items-center justify-between px-4 py-4 gap-1 bg-white dark:bg-secondary-900">
                <View className="flex-1 flex-row items-center gap-4">
                  {q.image && (
                    <Image
                      source={q.image}
                      style={{ width: 56, height: 56, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  )}
                  <Text
                    className="flex-1 text-base text-secondary-700 dark:text-secondary-300"
                    numberOfLines={2}
                  >
                    {q.text}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={Secondary[400]}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
