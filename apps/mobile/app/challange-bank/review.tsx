import IntroHeader from "@/components/intro-header";
import { Secondary } from "@/constants/theme";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import { toast } from "@/store/toastStore";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengeBankReviewScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const questions = useChallengeBankStore((s) => s.questions);
  const refresh = useChallengeBankStore((s) => s.refresh);
  const remove = useChallengeBankStore((s) => s.remove);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleRemove = (questionId: number) => {
    remove(questionId); // optimistic locally + DELETE on the server
    toast.success("Removed from Challenge Bank");
  };

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
              No missed questions yet. Get some wrong in a test and they&apos;ll show up here.
            </Text>
          </View>
        ) : (
          questions.map((q, index) => {
            const image = q.image_urls?.[0];
            return (
              <View
                key={q.id}
                className="flex-row items-center border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900"
              >
                {/* Tap the row to re-practice from this question */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/challange-bank/quiz",
                      params: { initialIndex: String(index) },
                    })
                  }
                  className="flex-1 flex-row items-center gap-4 px-4 py-4"
                >
                  {image && (
                    <Image
                      source={{ uri: image }}
                      style={{ width: 56, height: 56, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  )}
                  <Text
                    className="flex-1 text-base text-secondary-700 dark:text-secondary-300"
                    numberOfLines={2}
                  >
                    {q.question_text}
                  </Text>
                </TouchableOpacity>

                {/* Remove this question from the Challenge Bank */}
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => handleRemove(q.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="px-4 py-4"
                >
                  <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
