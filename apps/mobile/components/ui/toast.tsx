import { Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { useToastStore, type ToastType } from "@/store/toastStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VISIBLE_MS = 2600;

const CONFIG: Record<ToastType, { icon: keyof typeof MaterialIcons.glyphMap; color: string }> = {
  success: { icon: "check-circle", color: "#22c55e" },
  error: { icon: "error-outline", color: "#ef4444" },
  info: { icon: "info-outline", color: "#3b82f6" },
};

/**
 * A single modern toast rendered once at the app root — slides down from the top, auto-dismisses,
 * and can be tapped to close. Driven by the toast store (`toast.success(...)`), it replaces the
 * blocking `Alert.alert` modals for lightweight confirmations.
 */
export function Toast() {
  const { message, type, visible, token, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();

  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 190 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(() => hide(), VISIBLE_MS);
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -140, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // `token` re-triggers the entrance even when the same message is shown twice in a row.
  }, [visible, token, hide, translateY, opacity]);

  const config = CONFIG[type];

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={hide}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: isDark ? Secondary[800] : White.DEFAULT,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: isDark ? Secondary[700] : Secondary[100],
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.4 : 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }}
      >
        <Animated.View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: config.color + "22",
          }}
        >
          <MaterialIcons name={config.icon} size={20} color={config.color} />
        </Animated.View>

        <Text
          numberOfLines={2}
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? Secondary[50] : Secondary[900],
          }}
        >
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
