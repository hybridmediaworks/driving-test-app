import IntroHeader from "@/components/intro-header";
import { Error, Success } from "@/constants/theme";
import { getQuestionsByTestId } from "@/services/testService";
import { useLastAttemptStore } from "@/store/lastAttemptStore";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Cards sourced from the live API carry a numeric id; the older mock test bank uses string ids
// like "car-e1", or "challenge-bank".
const isApiId = (value: string) => /^\d+$/.test(value);

export default function ReviewScreen() {
  const { id, missedIds } = useLocalSearchParams<{
    id: string;
    missedIds?: string;
  }>();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastAttempt = useLastAttemptStore((s) => s.attempt);

  const isApi = isApiId(id);

  if (isApi) {
    // The graded per-question detail (question text + correctness) only exists right after
    // submitting — the backend has no "replay a past attempt" endpoint this screen can fall back
    // to, so a stale/missing hand-off (e.g. the app restarted before revisiting Review) means
    // there's genuinely nothing to show instead of guessing at content.
    const attemptAnswers =
      lastAttempt && String(lastAttempt.quiz_id) === id ? (lastAttempt.answers ?? []) : null;

    if (!attemptAnswers) {
      return (
        <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center px-6">
          <Text className="text-secondary-500 text-center">
            Review is only available right after finishing this test.
          </Text>
        </SafeAreaView>
      );
    }

    const correctCount = attemptAnswers.filter((a) => a.is_correct).length;
    const description = `${attemptAnswers.length} questions • ${correctCount} correct • ${attemptAnswers.length - correctCount} incorrect`;

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
          {attemptAnswers.map((a, index) => (
            <View key={a.question_id}>
              <View className="flex-row items-center px-4 py-4 gap-4 bg-white dark:bg-secondary-900">
                <View className="w-6 items-center">
                  {a.is_correct ? (
                    <MaterialIcons name="check" size={22} color={Success.DEFAULT} />
                  ) : (
                    <MaterialIcons name="close" size={22} color={Error.DEFAULT} />
                  )}
                </View>

                <Text
                  className="flex-1 text-base text-secondary-700 dark:text-secondary-300"
                  numberOfLines={2}
                >
                  {index + 1}. {a.question_text}
                </Text>
              </View>

              <View className="h-px bg-secondary-200 dark:bg-secondary-700 mx-4" />
            </View>
          ))}
        </Animated.ScrollView>
      </SafeAreaView>
    );
  }

  return <MockReviewScreen id={id} missedIds={missedIds} scrollY={scrollY} />;
}

function MockReviewScreen({
  id,
  missedIds,
  scrollY,
}: {
  id: string;
  missedIds?: string;
  scrollY: Animated.Value;
}) {
  const router = useRouter();
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
