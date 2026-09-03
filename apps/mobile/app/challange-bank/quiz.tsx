import { AiChatSheet } from "@/components/quiz/ai-chat-sheet";
import { QuizImage } from "@/components/quiz/quiz-image";
import { QuizOption, type QuizOptionVariant } from "@/components/quiz/quiz-option";
import { ReportProblemSheet } from "@/components/quiz/report-problem-sheet";
import { Primary, Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { requestAppRating } from "@/lib/appRating";
import {
  removeFromChallengeBank,
  type ChallengeBankQuestion,
} from "@/services/api/challengeBankApi";
import { checkAnswer } from "@/services/api/quizApi";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type CheckedAnswer = {
  selectedAnswerId: number;
  correctAnswerId: number | null;
  isCorrect: boolean;
  explanation: string | null;
};

/**
 * Re-practice the Quiz Vault as a mastery loop (spaced repetition):
 *
 *  - The active sequence is a queue; the question at the front is the current one.
 *  - Answer correctly  → it "graduates": removed from the queue and from the bank on the server.
 *  - Answer incorrectly → it stays in the queue, reinserted at a random later position so it comes
 *    back again (never immediately, as long as other questions remain).
 *
 * The drill only ends once every question has been answered correctly at least once (queue empty),
 * not after a fixed number of steps. The queue is a local snapshot so removing questions on the
 * server mid-session doesn't disturb the flow.
 */
export default function ChallengeBankQuizScreen() {
  const router = useRouter();
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[50] : Secondary[900];
  const mutedIconColor = isDark ? Secondary[400] : Secondary[500];
  const insets = useSafeAreaInsets();

  const { initialIndex } = useLocalSearchParams<{ initialIndex?: string }>();

  // Snapshot the bank once for this session.
  const [initialQuestions] = useState(() => useChallengeBankStore.getState().questions);
  const total = initialQuestions.length;

  // Active sequence — front of the queue is the current question.
  const [queue, setQueue] = useState<ChallengeBankQuestion[]>(() => {
    if (initialQuestions.length === 0) return [];
    const start = initialIndex ? Math.max(0, parseInt(initialIndex, 10) || 0) : 0;
    const s = Math.min(start, initialQuestions.length - 1);
    // Rotate so the requested question leads, keeping every question in the loop.
    return [...initialQuestions.slice(s), ...initialQuestions.slice(0, s)];
  });
  const [checked, setChecked] = useState<CheckedAnswer | null>(null);
  const [checking, setChecking] = useState(false);
  // Instantly highlight the tapped option while it's being graded (see the main quiz screen).
  const [pendingAnswerId, setPendingAnswerId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(false);
  // Set when the sheet opens via the "why is my answer wrong?" prompt so it auto-asks on open.
  const [aiAutoAsk, setAiAutoAsk] = useState<"why-wrong" | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  // ── Empty bank ──
  if (total === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center px-6">
        <Text className="text-secondary-500 text-center mb-4">
          Your Quiz Vault is empty — nice work! 🎉
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

  // ── All questions mastered ──
  if (completed || queue.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center px-6">
        <Text className="text-5xl mb-4">🎉</Text>
        <Text className="text-xl font-bold text-secondary-900 dark:text-secondary-50 text-center mb-1">
          All done!
        </Text>
        <Text className="text-secondary-500 text-center mb-6">
          You answered every question correctly. They&apos;ve been cleared from your Quiz Vault.
        </Text>
        <TouchableOpacity
          onPress={() => {
            useChallengeBankStore.getState().refresh();
            router.back();
          }}
          className="bg-primary rounded-full px-6 py-3"
        >
          <Text className="text-white font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const current = queue[0];
  const isAnswered = !!checked;
  const isWrong = isAnswered && !checked?.isCorrect;
  // How many questions still have to be answered correctly. A correct answer graduates the current
  // question out of the pool, so the count ticks down the instant they get it right — before they
  // even tap Next. A wrong answer keeps the question in the pool, so the count is unchanged.
  const remaining = queue.length - (checked?.isCorrect ? 1 : 0);
  const progress = total === 0 ? 0 : (total - remaining) / total;
  const currentImage = current.image_urls?.[0];
  // Answering the last remaining question correctly finishes the drill.
  const willFinish = !!checked?.isCorrect && queue.length === 1;

  const handleSelect = async (answerId: number) => {
    if (isAnswered || checking) return;
    setChecking(true);
    setPendingAnswerId(answerId);
    try {
      const result = await checkAnswer(current.quiz_id, current.id, answerId);
      Haptics.notificationAsync(
        result.is_correct
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
      setChecked({
        selectedAnswerId: answerId,
        correctAnswerId: result.correct_answer_id,
        isCorrect: result.is_correct,
        explanation: result.explanation,
      });
      // Correct → it graduates out of the bank on the server. Kept out of the local queue on advance.
      if (result.is_correct) removeFromChallengeBank(current.id).catch(() => {});
    } catch {
      Alert.alert("Something went wrong", "Couldn't check that answer. Please try again.");
    } finally {
      setChecking(false);
      setPendingAnswerId(null);
    }
  };

  const handleNext = () => {
    if (!checked) return; // must answer before advancing

    const [head, ...rest] = queue;
    let nextQueue: ChallengeBankQuestion[];
    if (checked.isCorrect) {
      // Graduated — drop it from the active sequence.
      nextQueue = rest;
    } else if (rest.length === 0) {
      // Only this (wrong) question is left — it simply repeats until answered correctly.
      nextQueue = [head];
    } else {
      // Reinsert at a random later position ([1, rest.length]) so it never repeats immediately.
      const pos = 1 + Math.floor(Math.random() * rest.length);
      nextQueue = [...rest];
      nextQueue.splice(pos, 0, head);
    }

    if (nextQueue.length === 0) setCompleted(true);
    setQueue(nextQueue);
    setChecked(null);
  };

  // Empties the whole Quiz Vault (server + local), then leaves the drill since there's nothing left.
  const handleClearVault = () => {
    setMenuVisible(false);
    Alert.alert(
      "Clear Quiz Vault™",
      "This removes every question from your Quiz Vault. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            useChallengeBankStore.getState().clearAll().catch(() => {});
            router.back();
          },
        },
      ],
    );
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

  const variantForAnswer = (answerId: number): QuizOptionVariant => {
    if (!checked) return answerId === pendingAnswerId ? "selected" : "idle";
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
          {remaining} question{remaining !== 1 ? "s" : ""} left
        </Text>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <MaterialIcons name="more-vert" size={22} color={iconColor} />
        </TouchableOpacity>
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
                loading={pendingAnswerId === answer.id}
                burstKey={current.id}
              />
            );
          })}
        </View>

        {/* After a wrong answer: offer the AI "why is this wrong?" breakdown, then the loop note. */}
        {isWrong && (
          <>
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

            <Text className="mt-3 text-center text-sm text-secondary-500 dark:text-secondary-400">
              You&apos;ll see this question again later until you get it right.
            </Text>
          </>
        )}
      </ScrollView>

      <AiChatSheet
        visible={aiChatVisible}
        onClose={() => setAiChatVisible(false)}
        quizId={current.quiz_id}
        questionId={current.id}
        questionText={current.question_text}
        explanation={checked?.explanation ?? undefined}
        answered={isAnswered}
        selectedAnswerId={checked?.selectedAnswerId}
        isWrong={isWrong}
        autoAsk={aiAutoAsk}
      />

      {/* 3-dots dropdown — Quiz Vault actions (anchored under the header's ⋯ button). */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                position: "absolute",
                top: insets.top + 44,
                right: 12,
                width: 264,
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
              }}
              className="rounded-2xl bg-white dark:bg-secondary-800 py-1"
            >
              <TouchableOpacity
                onPress={handleClearVault}
                activeOpacity={0.65}
                className="flex-row items-center justify-between px-4 py-3.5"
              >
                <Text className="text-base font-semibold" style={{ color: "#ef4444" }}>
                  Clear Quiz Vault™
                </Text>
                <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
              </TouchableOpacity>

              <View className="h-px bg-secondary-100 dark:bg-secondary-700 mx-4" />

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  setReportVisible(true);
                }}
                activeOpacity={0.65}
                className="flex-row items-center justify-between px-4 py-3.5"
              >
                <Text className="text-base text-secondary-900 dark:text-secondary-50">
                  Report a Problem
                </Text>
                <MaterialIcons name="feedback" size={22} color={mutedIconColor} />
              </TouchableOpacity>

              <View className="h-px bg-secondary-100 dark:bg-secondary-700 mx-4" />

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  requestAppRating();
                }}
                activeOpacity={0.65}
                className="flex-row items-center justify-between px-4 py-3.5"
              >
                <Text className="text-base text-secondary-900 dark:text-secondary-50">
                  Enjoying DMV Genie?
                </Text>
                <MaterialIcons name="favorite-border" size={22} color={mutedIconColor} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ReportProblemSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        quizId={current.quiz_id}
        question={current}
      />

      {/* Bottom bar — full-width Next with the AI hint button on the right (matches the quiz screen). */}
      <View className="flex-row items-center px-4 pb-3 pt-2 gap-3 border-t border-secondary-100 dark:border-secondary-800">
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={!isAnswered}
          className={`flex-1 bg-primary rounded-full py-4 items-center justify-center ${
            isAnswered ? "" : "opacity-40"
          }`}
        >
          <Text className="text-white text-base font-semibold">
            {willFinish ? "Finish" : "Next"}
          </Text>
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
