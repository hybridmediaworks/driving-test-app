import { AiChatSheet } from "@/components/quiz/ai-chat-sheet";
import { QuizMenuSheet } from "@/components/quiz/quiz-menu-sheet";
import { Primary, Secondary } from "@/constants/theme";
import { MOCK_QUESTIONS } from "@/data/mockQuestions";
import { useIsDark } from "@/hooks/use-is-dark";
import { checkAnswer, fetchQuiz, submitAttempt } from "@/services/api/quizApi";
import { getQuestionsByTestId, getTestById } from "@/services/testService";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import { useLastAttemptStore } from "@/store/lastAttemptStore";
import type { PublicQuizQuestion } from "@driving-test-app/shared";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Cards sourced from the live API carry a numeric id; the older mock test bank (still used by
// the Progress tab and the local Challenge Bank feature, neither migrated yet) uses string ids
// like "car-e1", or the literal "challenge-bank".
const isApiId = (value: string) => /^\d+$/.test(value);

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string; initialIndex?: string }>();
  return isApiId(id) ? <ApiQuizScreen quizId={id} /> : <MockQuizScreen />;
}

// ─── Real quiz, live API ──────────────────────────────────────────────────────

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
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    fetchQuiz(quizId).then((res) => {
      if (cancelled) return;
      setLocked(res.locked);
      setQuestions(res.questions ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [quizId]);

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
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const progress = (currentIndex + 1) / questions.length;
  const currentImage = current.image_urls?.[0];

  const handleSelect = async (answerId: number) => {
    if (isAnswered || checking) return;
    setChecking(true);
    try {
      const result = await checkAnswer(quizId, current.id, answerId);
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

  const handleHint = () => setAiChatVisible(true);

  const handleRestart = () => {
    setCurrentIndex(0);
    setCheckedAnswers({});
  };

  const getOptionStyle = (answerId: number): string => {
    if (!isAnswered) return "bg-secondary-100 dark:bg-secondary-800";
    if (answerId === checked.correctAnswerId) {
      return "bg-green-100 dark:bg-green-900 border border-green-500";
    }
    if (answerId === checked.selectedAnswerId) {
      return "bg-red-100 dark:bg-red-900 border border-red-400";
    }
    return "bg-secondary-100 dark:bg-secondary-800 opacity-40";
  };

  const getOptionTextStyle = (answerId: number): string => {
    if (!isAnswered) return "text-secondary-800 dark:text-secondary-100";
    if (answerId === checked.correctAnswerId) {
      return "text-green-800 dark:text-green-200 font-medium";
    }
    if (answerId === checked.selectedAnswerId) {
      return "text-red-700 dark:text-red-300 font-medium";
    }
    return "text-secondary-500 dark:text-secondary-500";
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
        <View className="flex-row items-start gap-3 mb-6">
          <Text className="flex-1 text-2xl font-bold leading-8 text-secondary-900 dark:text-secondary-50">
            {current.question_text}
          </Text>

          {currentImage && (
            <Image
              source={{ uri: currentImage }}
              style={{ width: 110, height: 90, borderRadius: 10 }}
              resizeMode="cover"
            />
          )}
        </View>

        <View className="gap-3">
          {current.answers.map((answer) => (
            <TouchableOpacity
              key={answer.id}
              activeOpacity={isAnswered ? 1 : 0.75}
              onPress={() => handleSelect(answer.id)}
              disabled={checking}
              className={`rounded-2xl px-4 py-4 ${getOptionStyle(answer.id)}`}
            >
              <Text className={`text-base ${getOptionTextStyle(answer.id)}`}>
                {answer.answer_text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <AiChatSheet
        visible={aiChatVisible}
        onClose={() => setAiChatVisible(false)}
        questionText={current.question_text}
        explanation={checked?.explanation ?? undefined}
      />

      <QuizMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={handleRestart}
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

// ─── Mock test bank / Challenge Bank — unchanged, still used by the Progress tab and Challenge
// Bank feature, neither migrated to the live API yet ────────────────────────────────────────────

function MockQuizScreen() {
  const { id, initialIndex } = useLocalSearchParams<{ id: string; initialIndex?: string }>();
  const router = useRouter();

  const { missedQuestionIds } = useChallengeBankStore();

  const isChallenge = id === "challenge-bank";

  const test = isChallenge
    ? {
        id: "challenge-bank",
        title: "Challenge Bank™",
        subtitle: "Missed questions",
        difficulty: "hard" as const,
        vehicle: "car" as const,
        questionsCount: missedQuestionIds.length,
        passingScore: 80,
        description: "",
      }
    : getTestById(id);

  const questions = isChallenge
    ? MOCK_QUESTIONS.filter((q) => missedQuestionIds.includes(q.id))
    : getQuestionsByTestId(id);

  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[50] : Secondary[900];
  const mutedIconColor = isDark ? Secondary[400] : Secondary[500];

  const [currentIndex, setCurrentIndex] = useState(
    initialIndex ? Math.min(parseInt(initialIndex, 10), questions.length - 1) : 0
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(false);
  // answers[i] = selected option index, or null if skipped
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(questions.length).fill(null)
  );

  if (!test || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center">
        <Text className="text-secondary-500">No questions found.</Text>
      </SafeAreaView>
    );
  }

  const current = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const progress = (currentIndex + 1) / questions.length;

  const handleSelect = (optionIndex: number) => {
    if (isAnswered) return;
    const updated = [...answers];
    updated[currentIndex] = optionIndex;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (isLast) {
      const correct = answers.filter(
        (a, i) => a === questions[i].correctIndex
      ).length;
      const missedIds = questions
        .filter((q, i) => answers[i] !== q.correctIndex)
        .map((q) => q.id)
        .join(",");
      router.replace({
        pathname: "/test/results/[id]",
        params: {
          id,
          correct: String(correct),
          total: String(questions.length),
          missedIds,
          fromQuiz: "true",
        },
      });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  };

  const handleHint = () => setAiChatVisible(true);

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers(Array(questions.length).fill(null));
  };

  const getOptionStyle = (optionIndex: number): string => {
    if (!isAnswered) {
      return "bg-secondary-100 dark:bg-secondary-800";
    }
    if (optionIndex === current.correctIndex) {
      return "bg-green-100 dark:bg-green-900 border border-green-500";
    }
    if (optionIndex === selectedAnswer) {
      return "bg-red-100 dark:bg-red-900 border border-red-400";
    }
    return "bg-secondary-100 dark:bg-secondary-800 opacity-40";
  };

  const getOptionTextStyle = (optionIndex: number): string => {
    if (!isAnswered) {
      return "text-secondary-800 dark:text-secondary-100";
    }
    if (optionIndex === current.correctIndex) {
      return "text-green-800 dark:text-green-200 font-medium";
    }
    if (optionIndex === selectedAnswer) {
      return "text-red-700 dark:text-red-300 font-medium";
    }
    return "text-secondary-500 dark:text-secondary-500";
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-secondary-900"
      edges={["top", "bottom"]}
    >
      {/* ── Header ── */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={iconColor}
          />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-base font-semibold text-secondary-900 dark:text-secondary-50">
          {currentIndex + 1}/{questions.length}
        </Text>

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <MaterialIcons
            name="more-vert"
            size={22}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      <View className="h-0.5 bg-secondary-100 dark:bg-secondary-800">
        <View
          className="h-full bg-primary"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        {/* Question row */}
        <View className="flex-row items-start gap-3 mb-6">
          <Text className="flex-1 text-2xl font-bold leading-8 text-secondary-900 dark:text-secondary-50">
            {current.text}
          </Text>

          {current.image && (
            <Image
              source={current.image}
              style={{ width: 110, height: 90, borderRadius: 10 }}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Options */}
        <View className="gap-3">
          {current.options.map((option, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={isAnswered ? 1 : 0.75}
              onPress={() => handleSelect(i)}
              className={`rounded-2xl px-4 py-4 ${getOptionStyle(i)}`}
            >
              <Text className={`text-base ${getOptionTextStyle(i)}`}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── AI Chat sheet ── */}
      <AiChatSheet
        visible={aiChatVisible}
        onClose={() => setAiChatVisible(false)}
        questionText={current.text}
        explanation={current.explanation}
      />

      {/* ── Menu sheet ── */}
      <QuizMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={handleRestart}
      />

      {/* ── Bottom bar ── */}
      <View className="flex-row items-center px-4 pb-3 pt-2 gap-3 border-t border-secondary-100 dark:border-secondary-800">
        {/* Previous */}
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

        {/* Next */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          className="flex-1 bg-primary rounded-full py-4 items-center justify-center"
        >
          <Text className="text-white text-base font-semibold">
            {isLast ? "Finish" : "Next"}
          </Text>
        </TouchableOpacity>

        {/* Hint */}
        <TouchableOpacity
          onPress={handleHint}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full border border-secondary-200 dark:border-secondary-700"
        >
          <MaterialIcons
            name="help-outline"
            size={20}
            color={mutedIconColor}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
