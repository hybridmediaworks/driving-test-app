import { Primary, Secondary } from "@/constants/theme";
import type { Message } from "@/hooks/use-ai-chat";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type Props = { message: Message };

// Three dots that fade in sequence while the AI reply is in flight — the "typing…" cue.
function TypingDots() {
  const isDark = useIsDark();
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((dots.length - i) * 160),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  const dotColor = isDark ? Secondary[400] : Secondary[500];

  return (
    <View className="flex-row gap-1 items-center" style={{ height: 24 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, opacity: dot }}
        />
      ))}
    </View>
  );
}

export function AiMessageBubble({ message }: Props) {
  if (message.role === "ai") {
    return (
      <View className="flex-row gap-3 items-start">
        <MaterialIcons name="auto-awesome" size={20} color={Primary.DEFAULT} style={{ marginTop: 2 }} />
        {message.pending ? (
          <TypingDots />
        ) : (
          <Text className="flex-1 text-base leading-6 text-secondary-900 dark:text-secondary-50">
            {message.text}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="items-end">
      <View
        className="bg-primary-50 dark:bg-primary-900 max-w-[80%] px-4 py-2.5"
        style={{ borderRadius: 16, borderBottomRightRadius: 4 }}
      >
        <Text className="text-sm text-primary-800 dark:text-primary-200">
          {message.text}
        </Text>
      </View>
    </View>
  );
}
