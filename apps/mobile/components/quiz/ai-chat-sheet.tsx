import { AiMessageBubble } from "@/components/quiz/ai-message-bubble";
import { Primary, Secondary, White } from "@/constants/theme";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heading } from "../ui/heading";

type Props = {
  visible: boolean;
  onClose: () => void;
  questionText?: string;
  explanation?: string;
};

const QUICK_ACTIONS = [
  { label: "Give me a hint", key: "hint" },
  { label: "Help me understand this", key: "explain" },
];

export function AiChatSheet({ visible, onClose, explanation }: Props) {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(800)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  const {
    messages,
    input,
    setInput,
    scrollRef,
    handleSend,
    handleQuickAction,
    handleClear,
  } = useAiChat(explanation);

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
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardAnim, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === "ios" ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: Platform.OS === "ios" ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const mutedIconColor = isDark ? Secondary[400] : Secondary[500];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            opacity: fadeAnim,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Sheet – outer handles keyboard offset (JS driver), inner handles slide (native driver) */}
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
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-secondary-200 dark:border-secondary-700">
            <View className="flex-row items-center gap-2">
              <Heading level="h5" weight="bold" color="primary">
                Ask DMV Genie AI
              </Heading>
              <View className="bg-error rounded-md px-1.5 py-0.5 mr-3">
                <Text className="text-white text-xs font-black">NEW</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={28}
                color={mutedIconColor}
              />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <Animated.ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <AiMessageBubble key={msg.id} message={msg} />
            ))}
          </Animated.ScrollView>

          {/* Quick actions */}
          <View className="flex-row flex-wrap gap-2 px-4 pb-3">
            {QUICK_ACTIONS.map(({ label, key }) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleQuickAction(key)}
                activeOpacity={0.75}
                className="border border-primary-300 rounded-full px-4 py-2"
              >
                <Text className="text-sm font-semibold text-primary">
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input */}
          <View className="flex-row items-center mx-4 mb-2.5 bg-secondary-100 dark:bg-secondary-800 rounded-xl px-4 py-1">
            <TextInput
              className="flex-1 text-base text-secondary-900 dark:text-secondary-50 py-2.5"
              placeholder="Type your message here..."
              placeholderTextColor={isDark ? Secondary[500] : Secondary[400]}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleSend} activeOpacity={0.7}>
              <MaterialIcons
                name="send"
                size={20}
                color={input.trim() ? Primary.DEFAULT : mutedIconColor}
              />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View
            className="flex-row justify-center gap-5 pt-1"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            <TouchableOpacity onPress={() => {}}>
              <Text className="text-sm font-semibold text-primary">
                How it works
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClear}>
              <Text className="text-sm font-semibold text-primary">
                Clear chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
