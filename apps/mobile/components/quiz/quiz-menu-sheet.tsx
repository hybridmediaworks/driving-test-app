import { Primary, Secondary, White } from "@/constants/theme";
import { Switch } from "@/components/ui/switch";
import { useIsDark } from "@/hooks/use-is-dark";
import { useThemeStore } from "@/store/themeStore";
import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRestart: () => void;
};

type MenuItem =
  | {
      kind: "action";
      label: string;
      bold?: boolean;
      rightLabel?: string;
      rightColor?: string;
      onPress: () => void;
    }
  | {
      kind: "toggle";
      label: string;
      value: boolean;
      onToggle: (v: boolean) => void;
    };

export function QuizMenuSheet({ visible, onClose, onRestart }: Props) {
  const isDark = useIsDark();
  const { preference, setPreference } = useThemeStore();
  const handleNightModeToggle = (value: boolean) => {
    setPreference(value ? "dark" : "light");
  };

  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const items: MenuItem[] = [
    {
      kind: "action",
      label: "Restart Test",
      onPress: () => {
        onClose();
        onRestart();
      },
    },
    {
      kind: "action",
      label: "Report a Problem",
      onPress: () => {
        onClose();
        Alert.alert(
          "Report a Problem",
          "Thank you — your report has been received.",
        );
      },
    },
    {
      kind: "action",
      label: "Enjoying DMV Genie?",
      onPress: () => {
        onClose();
        Alert.alert("Rate Us", "Please rate us on the App Store!");
      },
    },
    {
      kind: "action",
      label: "Premium Account",
      bold: true,
      rightLabel: "GET",
      rightColor: Primary.DEFAULT,
      onPress: () => {
        onClose();
        Alert.alert("Premium", "Upgrade to unlock all features.");
      },
    },
    {
      kind: "action",
      label: "Add to Challenge Bank™",
      onPress: () => {
        onClose();
        Alert.alert("Challenge Bank", "Question added to your Challenge Bank.");
      },
    },
    {
      kind: "action",
      label: "PDF Cheat Sheets",
      onPress: () => {
        onClose();
        Alert.alert(
          "PDF Cheat Sheets",
          "Download cheat sheets from the Theory section.",
        );
      },
    },
    {
      kind: "toggle",
      label: "Night Mode",
      value: isDark,
      onToggle: handleNightModeToggle,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay — Animated.View requires style for animated opacity */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            opacity: fadeAnim,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Sheet — Animated.View requires style for animated transform */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: slideAnim }],
          backgroundColor: isDark ? Secondary[800] : White.DEFAULT,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 34,
        }}
      >
        {/* Drag handle */}
        <View className="items-center pt-3 pb-2">
          <View className="w-10 h-1 rounded-full bg-secondary-300 dark:bg-secondary-600" />
        </View>

        {/* Menu items */}
        {items.map((item, index) => (
          <View key={index}>
            {/* Divider */}
            <View className="h-px bg-secondary-100 dark:bg-secondary-700" />

            {item.kind === "action" ? (
              <TouchableOpacity
                onPress={item.onPress}
                activeOpacity={0.65}
                className="flex-row items-center justify-between px-5 py-4"
              >
                <Text
                  className={`text-base ${
                    item.bold
                      ? "font-bold text-secondary-900 dark:text-secondary-50"
                      : "font-normal text-secondary-500 dark:text-secondary-400"
                  }`}
                >
                  {item.label}
                </Text>

                {item.rightLabel && (
                  <Text
                    className="text-base font-bold"
                    style={{ color: item.rightColor ?? Primary.DEFAULT }}
                  >
                    {item.rightLabel}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center justify-between px-5 py-3">
                <Text className="text-base text-secondary-500 dark:text-secondary-400">
                  {item.label}
                </Text>
                <Switch
                  value={isDark}
                  onValueChange={(val) => setPreference(val ? "dark" : "light")}
                />
              </View>
            )}
          </View>
        ))}
      </Animated.View>
    </Modal>
  );
}
