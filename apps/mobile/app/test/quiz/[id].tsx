import { AiChatSheet } from "@/components/quiz/ai-chat-sheet";
import { QuizImage } from "@/components/quiz/quiz-image";
import { QuizMenuSheet } from "@/components/quiz/quiz-menu-sheet";
import { QuizOption, type QuizOptionVariant } from "@/components/quiz/quiz-option";
import { ReportProblemSheet } from "@/components/quiz/report-problem-sheet";
import { Primary, Secondary } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { useIsDark } from "@/hooks/use-is-dark";
import { addToChallengeBank } from "@/services/api/challengeBankApi";
import { checkAnswer, fetchQuiz, submitAttempt } from "@/services/api/quizApi";
import { toast } from "@/store/toastStore";
import { useLastAttemptStore } from "@/store/lastAttemptStore";
import { useUserStore } from "@/store/userStore";
import type { PublicQuizQuestion } from "@driving-test-app/shared";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApiQuizScreen quizId={id} />;
}

type CheckedAnswer = {
  selectedAnswerId: number;
  correctAnswerId: number | null;
  isCorrect: boolean;
  explanation: string | null;
};

function ApiQuizScreen({ quizId }: { quizId: string }) {
  const router = useRouter();
  const isDark = useIsDark();
  const setLastAttempt = useLastAttemptStore((s) => s.setAttempt);
  const testLanguage = useUserStore((s) => s.testLanguage);
  const iconColor = isDark ? Secondary[50] : Secondary[900];
  const mutedIconColor = isDark ? Secondary[400] : Secondary[500];

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, CheckedAnswer>>({});
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(false);
  // Set when the sheet is opened via the "why is my answer wrong?" prompt so it auto-asks on open.
  const [aiAutoAsk, setAiAutoAsk] = useState<"why-wrong" | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Re-runs when the learner switches test language — the backend returns the same questions
    // translated, keyed by the same ids, so in-progress checked answers stay valid.
    fetchQuiz(quizId, testLanguage).then((res) => {
      if (cancelled) return;
      setLocked(res.locked);
      setQuestions(res.questions ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [quizId, testLanguage]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center">
        <ActivityIndicator size="large" color={Primary.DEFAULT} />
      </SafeAreaView>
    );
  }

  if (locked) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center px-6">
        <Text className="text-secondary-500 text-center mb-4">
          This test is a premium feature.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/premium")}
          className="bg-primary rounded-full px-6 py-3"
        >
          <Text className="text-white font-semibold">Unlock Premium</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center">
        <Text className="text-secondary-500">No questions found.</Text>
      </SafeAreaView>
    );
  }

  const current = questions[currentIndex];
  const checked = checkedAnswers[current.id];
  const isAnswered = !!checked;
  const isWrong = isAnswered && !checked.isCorrect;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const progress = (currentIndex + 1) / questions.length;
  const currentImage = current.image_urls?.[0];

  const handleSelect = async (answerId: number) => {
    if (isAnswered || checking) return;
    setChecking(true);
    try {
      const result = await checkAnswer(quizId, current.id, answerId, testLanguage);
      Haptics.notificationAsync(
        result.is_correct
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
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
    } catch {
      Alert.alert("Something went wrong", "Couldn't check that answer. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleNext = async () => {
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    try {
      const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);
      const answers = questions.map((q) => ({
        question_id: q.id,
        answer_id: checkedAnswers[q.id]?.selectedAnswerId ?? null,
      }));
      const attempt = await submitAttempt(quizId, answers, durationSeconds);
      setLastAttempt(attempt);

      const missedIds = (attempt.answers ?? [])
        .filter((a) => !a.is_correct)
        .map((a) => String(a.question_id))
        .join(",");

      router.replace({
        pathname: "/test/results/[id]",
        params: {
          id: quizId,
          correct: String(attempt.correct_count),
          total: String(attempt.total_questions),
          missedIds,
          passed: String(attempt.passed ?? false),
          fromQuiz: "true",
        },
      });
    } catch {
      Alert.alert("Something went wrong", "Couldn't submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  };

  const handleHint = () => {
    setAiAutoAsk(null);
    setAiChatVisible(true);
  };

  // Opens the AI coach straight into "why is my answer wrong?" — offered after a wrong answer.
  const handleWhyWrong = () => {
    setAiAutoAsk("why-wrong");
    setAiChatVisible(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCheckedAnswers({});
  };

  const handleAddToChallengeBank = async () => {
    try {
      await addToChallengeBank([current.id]);
      toast.success("Added to Challenge Bank");
    } catch {
      toast.error("Couldn't add — sign in and try again");
    }
  };

  const variantForAnswer = (answerId: number): QuizOptionVariant => {
    if (!isAnswered) return "idle";
    if (answerId === checked.correctAnswerId) return "correct";
    if (answerId === checked.selectedAnswerId) return "wrong";
    return "idle";
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900" edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <MaterialIcons name="chevron-left" size={28} color={iconColor} />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-base font-semibold text-secondary-900 dark:text-secondary-50">
          {currentIndex + 1}/{questions.length}
        </Text>

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <MaterialIcons name="more-vert" size={22} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      <View className="h-0.5 bg-secondary-100 dark:bg-secondary-800">
        <View className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>

      {/* ── Scrollable content ── */}
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

        {isWrong && (
          <TouchableOpacity
            onPress={handleWhyWrong}
            activeOpacity={0.85}
            className="mt-4 flex-row items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 px-4 py-3.5"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <MaterialIcons name="auto-awesome" size={20} color={Primary.DEFAULT} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-secondary-900 dark:text-secondary-50">
                See why your answer is wrong
              </Text>
              <Text className="text-xs text-secondary-500 dark:text-secondary-400">
                Ask DMV Genie AI to break it down
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={mutedIconColor} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <AiChatSheet
        visible={aiChatVisible}
        onClose={() => setAiChatVisible(false)}
        quizId={quizId}
        questionId={current.id}
        questionText={current.question_text}
        explanation={checked?.explanation ?? undefined}
        answered={isAnswered}
        selectedAnswerId={checked?.selectedAnswerId}
        isWrong={isWrong}
        autoAsk={aiAutoAsk}
      />

      <QuizMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={handleRestart}
        onReport={() => setReportVisible(true)}
        onAddToChallengeBank={handleAddToChallengeBank}
      />

      <ReportProblemSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        quizId={quizId}
        question={current}
      />

      {/* ── Bottom bar ── */}
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
          disabled={submitting}
          className="flex-1 bg-primary rounded-full py-4 items-center justify-center"
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {isLast ? "Finish" : "Next"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleHint}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full border border-secondary-200 dark:border-secondary-700"
        >
          <MaterialIcons name="help-outline" size={20} color={mutedIconColor} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
