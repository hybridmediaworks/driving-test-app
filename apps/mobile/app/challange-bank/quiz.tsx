import { QuizImage } from "@/components/quiz/quiz-image";
import { QuizOption, type QuizOptionVariant } from "@/components/quiz/quiz-option";
import { Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { removeFromChallengeBank } from "@/services/api/challengeBankApi";
import { checkAnswer } from "@/services/api/quizApi";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CheckedAnswer = {
  selectedAnswerId: number;
  correctAnswerId: number | null;
  isCorrect: boolean;
  explanation: string | null;
};

/**
 * Re-practice the questions in the Challenge Bank. Each answer is graded against the question's
 * original quiz (`quiz_id`) via the same check endpoint a normal quiz uses; answering correctly
 * removes it from the bank on the server, so the next time the learner opens the bank it's gone.
 * The list snapshot stays stable during the session so the flow doesn't jump when one graduates.
 */
export default function ChallengeBankQuizScreen() {
  const router = useRouter();
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[50] : Secondary[900];

  const { initialIndex } = useLocalSearchParams<{ initialIndex?: string }>();
  const questions = useChallengeBankStore((s) => s.questions);

  const [currentIndex, setCurrentIndex] = useState(() =>
    initialIndex ? Math.max(0, parseInt(initialIndex, 10) || 0) : 0,
  );
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, CheckedAnswer>>({});
  const [checking, setChecking] = useState(false);

  if (questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center px-6">
        <Text className="text-secondary-500 text-center mb-4">
          Your Challenge Bank is empty — nice work! 🎉
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary rounded-full px-6 py-3"
        >
          <Text className="text-white font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const safeIndex = Math.min(currentIndex, questions.length - 1);
  const current = questions[safeIndex];
  const checked = checkedAnswers[current.id];
  const isAnswered = !!checked;
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === questions.length - 1;
  const progress = (safeIndex + 1) / questions.length;
  const currentImage = current.image_urls?.[0];

  const handleSelect = async (answerId: number) => {
    if (isAnswered || checking) return;
    setChecking(true);
    try {
      const result = await checkAnswer(current.quiz_id, current.id, answerId);
      Haptics.notificationAsync(
        result.is_correct
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
      setCheckedAnswers((prev) => ({
        ...prev,
        [current.id]: {
          selectedAnswerId: answerId,
          correctAnswerId: result.correct_answer_id,
          isCorrect: result.is_correct,
          explanation: result.explanation,
        },
      }));
      // Got it right → it graduates out of the bank on the server (refreshed on the tab/progress
      // when the learner returns). Kept in this session's list so the flow doesn't reshuffle.
      if (result.is_correct) removeFromChallengeBank(current.id).catch(() => {});
    } catch {
      Alert.alert("Something went wrong", "Couldn't check that answer. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (isLast) {
      router.back();
      return;
    }
    setCurrentIndex(safeIndex + 1);
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentIndex(safeIndex - 1);
  };

  const variantForAnswer = (answerId: number): QuizOptionVariant => {
    if (!isAnswered) return "idle";
    if (answerId === checked.correctAnswerId) return "correct";
    if (answerId === checked.selectedAnswerId) return "wrong";
    return "idle";
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <MaterialIcons name="chevron-left" size={28} color={iconColor} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-base font-semibold text-secondary-900 dark:text-secondary-50">
          {safeIndex + 1}/{questions.length}
        </Text>
        <View className="w-9 h-9" />
      </View>

      {/* Progress bar */}
      <View className="h-0.5 bg-secondary-100 dark:bg-secondary-800">
        <View className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        <Text className="text-2xl font-bold leading-8 text-secondary-900 dark:text-secondary-50 mb-4">
          {current.question_text}
        </Text>

        {currentImage && <QuizImage uri={currentImage} />}

        <View className="gap-3">
          {current.answers.map((answer, index) => {
            const variant = variantForAnswer(answer.id);
            const celebrate = variant === "correct" && checked?.isCorrect === true;
            const showExplanation =
              celebrate || variant === "wrong" ? checked?.explanation : undefined;
            return (
              <QuizOption
                key={answer.id}
                index={index}
                text={answer.answer_text}
                variant={variant}
                celebrate={celebrate}
                explanation={showExplanation}
                onPress={() => handleSelect(answer.id)}
                disabled={isAnswered || checking}
                burstKey={current.id}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View className="flex-row items-center px-4 pb-3 pt-2 gap-3 border-t border-secondary-100 dark:border-secondary-800">
        <TouchableOpacity
          onPress={handlePrev}
          activeOpacity={isFirst ? 1 : 0.7}
          className="w-10 h-10 items-center justify-center"
        >
          <MaterialIcons
            name="chevron-left"
            size={26}
            color={isFirst ? Secondary[400] : isDark ? Secondary[200] : Secondary[700]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          className="flex-1 bg-primary rounded-full py-4 items-center justify-center"
        >
          <Text className="text-white text-base font-semibold">
            {isLast ? "Done" : "Next"}
          </Text>
        </TouchableOpacity>

        <View className="w-10 h-10" />
      </View>
    </SafeAreaView>
  );
}
