import { Avatar } from "@/components/ui/avatar";
import { Colors, Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { router } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const THRESHOLD = 50;

type TodayHeaderProps = {
  emoji?: string;
  scrollY: SharedValue<number>;
};

export function TodayHeader({ emoji = "🧑", scrollY }: TodayHeaderProps) {
  const isDark = useIsDark();
  const bg = isDark ? Colors.dark.background : White.DEFAULT;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;

  const [hasShadow, setHasShadow] = useState(false);

  useAnimatedReaction(
    () => scrollY.value >= THRESHOLD,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setHasShadow)(current);
      }
    },
  );

  const containerStyle = useAnimatedStyle(() => ({
    paddingTop: interpolate(
      scrollY.value,
      [0, THRESHOLD],
      [14, 8],
      Extrapolation.CLAMP,
    ),
    paddingBottom: interpolate(
      scrollY.value,
      [0, THRESHOLD],
      [18, 8],
      Extrapolation.CLAMP,
    ),
  }));

  // Spacer-only: collapses height to pull "Today" upward — no overflow needed
  const detailSpacerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, THRESHOLD],
      [18, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // Text is absolutely positioned so it animates freely without clipping issues
  const detailStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, THRESHOLD],
          [0, -12],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      scrollY.value,
      [0, THRESHOLD],
      [40, 30],
      Extrapolation.CLAMP,
    ),
    lineHeight: interpolate(
      scrollY.value,
      [0, THRESHOLD],
      [46, 36],
      Extrapolation.CLAMP,
    ),
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View
      style={{
        zIndex: 10,
        backgroundColor: bg,
        borderBottomWidth: hasShadow ? 1 : 0,
        borderBottomColor: isDark ? Secondary[700] : Secondary[200],
      }}
    >
      <Animated.View
        style={[{ backgroundColor: bg, paddingHorizontal: 16 }, containerStyle]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ position: "relative" }}>
            {/* Spacer collapses to pull "Today" upward */}
            <Animated.View style={detailSpacerStyle} />

            {/* Absolutely positioned so it slides up and fades without clipping */}
            <Animated.Text
              style={[
                {
                  position: "absolute",
                  top: 0,
                  fontWeight: "600",
                  color: Secondary[isDark ? 400 : 500],
                },
                detailStyle,
              ]}
            >
              DMV Genie
            </Animated.Text>

            <Animated.Text
              style={[{ fontWeight: "bold", color: textColor }, titleStyle]}
            >
              Today
            </Animated.Text>
          </View>

          <Animated.View style={avatarStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/settings")}
            >
              <Avatar emoji={emoji} size="sm" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
