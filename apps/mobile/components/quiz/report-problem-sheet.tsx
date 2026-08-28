import { Checkbox } from "@/components/ui/checkbox";
import { Heading } from "@/components/ui/heading";
import { Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { ApiError } from "@/lib/api";
import { reportQuestion } from "@/services/api/quizApi";
import type { PublicQuizQuestion } from "@driving-test-app/shared";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  quizId: number | string;
  question: PublicQuizQuestion;
};

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onChange(!checked)}
      className="flex-row items-start gap-3 py-2"
    >
      <View style={{ marginTop: 1 }}>
        <Checkbox checked={checked} onChange={onChange} size={22} />
      </View>
      <Text className="flex-1 text-sm leading-5 text-secondary-700 dark:text-secondary-300">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ReportProblemSheet({ visible, onClose, quizId, question }: Props) {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(800)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  const hasImage =
    question.image_urls.length > 0 || question.assets.some((a) => a.type === "lottie");

  const [flagQuestion, setFlagQuestion] = useState(false);
  const [flagImage, setFlagImage] = useState(false);
  const [flagHint, setFlagHint] = useState(false);
  const [flagAnswerIds, setFlagAnswerIds] = useState<Set<number>>(new Set());
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever it's opened for a (possibly different) question.
  useEffect(() => {
    if (visible) {
      setFlagQuestion(false);
      setFlagImage(false);
      setFlagHint(false);
      setFlagAnswerIds(new Set());
      setComment("");
      setName("");
      setEmail("");
      setSubmitting(false);
    }
  }, [visible, question.id]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: visible ? 0 : 800,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 200 : 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  useEffect(() => {
    // iOS Modals don't resize for the keyboard, so we lift the sheet manually. On Android the Modal
    // window already resizes (adjustResize + edge-to-edge), so adding our own offset would
    // double-count and squash the sheet — leave keyboardAnim at 0 there.
    if (Platform.OS !== "ios") return;

    const onShow = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(keyboardAnim, {
        toValue: e.endCoordinates.height,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    });
    const onHide = Keyboard.addListener("keyboardWillHide", (e) => {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const toggleAnswer = (id: number, checked: boolean) => {
    setFlagAnswerIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const submit = async () => {
    if (submitting) return;
    if (!comment.trim()) {
      Alert.alert("Add a description", "Please describe what looks wrong before sending.");
      return;
    }
    setSubmitting(true);
    try {
      await reportQuestion(quizId, question.id, {
        comment: comment.trim(),
        flagged: {
          question: flagQuestion,
          image: flagImage,
          hint: flagHint,
          answers: [...flagAnswerIds],
        },
        reporter_name: name.trim() || null,
        reporter_email: email.trim() || null,
      });
      onClose();
      Alert.alert("Thank you", "Your report has been submitted.");
    } catch (err) {
      Alert.alert(
        "Couldn't send report",
        err instanceof ApiError ? err.message : "Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const mutedIconColor = isDark ? Secondary[400] : Secondary[500];
  const inputTextClass = "text-base text-secondary-900 dark:text-secondary-50";
  const placeholderColor = isDark ? Secondary[500] : Secondary[400];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", opacity: fadeAnim }}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={{
          position: "absolute",
          bottom: keyboardAnim,
          left: 0,
          right: 0,
          top: insets.top + 40,
        }}
      >
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY: slideAnim }],
            backgroundColor: isDark ? Secondary[900] : White.DEFAULT,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-secondary-200 dark:border-secondary-700">
            <Heading level="h5" weight="bold" color="default" className="flex-1 pr-3">
              Report a mistake
            </Heading>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <MaterialIcons name="close" size={24} color={mutedIconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm leading-5 text-secondary-500 dark:text-secondary-400 mb-3">
              Tick anything that looks wrong and tell us what to fix. Your report helps us keep the
              questions accurate.
            </Text>

            <Text className="text-sm font-semibold text-secondary-900 dark:text-secondary-50 mt-2">
              Question
            </Text>
            <CheckRow checked={flagQuestion} onChange={setFlagQuestion} label={question.question_text} />

            {hasImage && (
              <CheckRow checked={flagImage} onChange={setFlagImage} label="The sign or image" />
            )}

            <Text className="text-sm font-semibold text-secondary-900 dark:text-secondary-50 mt-3">
              Answers
            </Text>
            {question.answers.map((a) => (
              <CheckRow
                key={a.id}
                checked={flagAnswerIds.has(a.id)}
                onChange={(v) => toggleAnswer(a.id, v)}
                label={a.answer_text}
              />
            ))}

            <Text className="text-sm font-semibold text-secondary-900 dark:text-secondary-50 mt-3">
              Hint
            </Text>
            <CheckRow
              checked={flagHint}
              onChange={setFlagHint}
              label="The hint / explanation"
            />

            <Text className="text-sm text-secondary-600 dark:text-secondary-300 mt-4 mb-2">
              Describe what&apos;s wrong
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Tell us what looks wrong..."
              placeholderTextColor={placeholderColor}
              className={`${inputTextClass} bg-secondary-100 dark:bg-secondary-800 rounded-xl px-4 py-3`}
              style={{ minHeight: 96 }}
            />

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name (optional)"
              placeholderTextColor={placeholderColor}
              className={`${inputTextClass} bg-secondary-100 dark:bg-secondary-800 rounded-xl px-4 py-3 mt-3`}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Your email (optional)"
              placeholderTextColor={placeholderColor}
              className={`${inputTextClass} bg-secondary-100 dark:bg-secondary-800 rounded-xl px-4 py-3 mt-3`}
            />
          </ScrollView>

          {/* Footer buttons */}
          <View
            className="flex-row gap-3 px-5 pt-3 border-t border-secondary-100 dark:border-secondary-800"
            style={{ paddingBottom: insets.bottom + 10 }}
          >
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.75}
              className="flex-1 border border-primary-300 rounded-full py-3.5 items-center justify-center"
            >
              <Text className="text-base font-semibold text-primary">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              activeOpacity={0.85}
              disabled={submitting}
              className="flex-1 bg-primary rounded-full py-3.5 items-center justify-center"
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
