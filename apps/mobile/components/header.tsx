import { Avatar } from "@/components/ui/avatar";
import { Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Animated, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderProps = {
  title: string;
  subtitle?: string;
  scrollY: Animated.Value;
  whiteBackground?: boolean;
  avatar?: boolean;
  backgroundImage?: string;
};

export default function Header({
  title,
  subtitle,
  scrollY,
  whiteBackground,
  avatar,
  backgroundImage,
}: HeaderProps) {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const fontSize = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [30, 28],
    extrapolate: "clamp",
  });

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const subtitleTranslateY = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [10, -40],
    extrapolate: "clamp",
  });

  const subtitleMarginBottom = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -22],
    extrapolate: "clamp",
  });

  const borderBottomWidth = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const totalTranslate = 180 + insets.top;
  const headerTranslateY = backgroundImage
    ? scrollY.interpolate({
        inputRange: [0, totalTranslate],
        outputRange: [0, -totalTranslate],
        extrapolate: "clamp",
      })
    : undefined;

  return (
    <Animated.View
      style={{
        borderBottomWidth,
        borderBottomColor: isDark ? Secondary[800] : Secondary[200],
        position: "absolute",
        top: insets.top,
        zIndex: 10,
        backgroundColor: isDark
          ? Secondary[900]
          : whiteBackground
            ? White.DEFAULT
            : White.off,
        width: "100%",
        overflow: backgroundImage ? "hidden" : "visible",
        transform: headerTranslateY
          ? [{ translateY: headerTranslateY }]
          : undefined,
      }}
    >
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={{ width: "100%", height: 180 }}
          contentFit="cover"
        />
      )}
      <Animated.View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 20,
        }}
      >
        <Animated.View>
          {subtitle && (
            <Animated.View
              style={{
                transform: [{ translateY: subtitleTranslateY }],
                opacity: subtitleOpacity,
                marginBottom: subtitleMarginBottom,
              }}
            >
              <Text
                numberOfLines={1}
                className="font-sans-semibold text-base text-secondary-600 dark:text-secondary-50"
              >
                {subtitle}
              </Text>
            </Animated.View>
          )}
          <Animated.Text
            style={{
              fontSize,
              fontFamily: "Sora_700Bold",
              color: isDark ? Secondary[50] : Secondary[900],
            }}
          >
            {title}
          </Animated.Text>
        </Animated.View>
        {avatar && (
          <Animated.View
            style={{
              opacity: subtitleOpacity,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/settings")}
            >
              <Avatar emoji="🧑" size="sm" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
}
