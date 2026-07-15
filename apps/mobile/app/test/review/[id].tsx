import IntroHeader from "@/components/intro-header";
import { Error, Success } from "@/constants/theme";
import { getQuestionsByTestId, getTestById } from "@/services/testService";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewScreen() {
  const { id, missedIds } = useLocalSearchParams<{
    id: string;
    missedIds?: string;
  }>();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const test = getTestById(id);
  const questions = getQuestionsByTestId(id);
  const missedSet = new Set<string>(missedIds ? missedIds.split(",").filter(Boolean) : []);

  const correctCount = questions.length - missedSet.size;
  const description = `${questions.length} questions • ${correctCount} correct • ${missedSet.size} incorrect`;

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
        {questions.map((q, index) => {
          const isCorrect = !missedSet.has(q.id);
          return (
            <View key={q.id}>
              <View className="flex-row items-center px-4 py-4 gap-4 bg-white dark:bg-secondary-900">
                {/* Correct / incorrect icon */}
                <View className="w-6 items-center">
                  {isCorrect ? (
                    <MaterialIcons
                      name="check"
                      size={22}
                      color={Success.DEFAULT}
                    />
                  ) : (
                    <MaterialIcons
                      name="close"
                      size={22}
                      color={Error.DEFAULT}
                    />
                  )}
                </View>

                {/* Question text */}
                <Text
                  className="flex-1 text-base text-secondary-700 dark:text-secondary-300"
                  numberOfLines={2}
                >
                  {index + 1}. {q.text}
                </Text>

                {/* Optional image */}
                {q.image && (
                  <Image
                    source={q.image}
                    style={{ width: 56, height: 56, borderRadius: 8 }}
                    contentFit="cover"
                  />
                )}
              </View>

              {/* Divider */}
              <View className="h-px bg-secondary-200 dark:bg-secondary-700 mx-4" />
            </View>
          );
        })}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
