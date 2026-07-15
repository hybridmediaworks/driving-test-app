import { Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Animated, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IntroHeaderProps = {
  backUrl?: () => void;
  title?: string;
  description?: string;
  scrollY: Animated.Value;
  whiteBackground?: boolean;
};

export default function IntroHeader({
  backUrl,
  title,
  description,
  scrollY,
  whiteBackground,
}: IntroHeaderProps) {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const iconColor = isDark ? Secondary[100] : Secondary[700];

  const paddingTop = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [50, 3],
    extrapolate: "clamp",
  });

  const paddingLeft = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 40],
    extrapolate: "clamp",
  });

  const fontSize = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [40, 28],
    extrapolate: "clamp",
  });

  const metaOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const metaHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [24, 0],
    extrapolate: "clamp",
  });

  const borderBottomWidth = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      className="px-4 pt-2 pb-3"
      style={{
        borderBottomWidth,
        borderBottomColor: isDark ? Secondary[800] : Secondary[200],
        paddingInline: 16,
        paddingBlock: 20,
        position: "absolute",
        top: insets.top,
        zIndex: 10,
        backgroundColor: isDark
          ? Secondary[900]
          : whiteBackground
            ? White.DEFAULT
            : White.off,
        width: "100%",
      }}
    >
      <TouchableOpacity
        onPress={backUrl}
        activeOpacity={0.7}
        className="w-10 h-10 items-center justify-start absolute top-3 left-0 z-[100]"
      >
        <MaterialIcons name="chevron-left" size={40} color={iconColor} />
      </TouchableOpacity>

      <Animated.View style={{ paddingLeft, paddingTop, zIndex: -1 }}>
        <Animated.Text
          style={{
            fontSize,
            fontWeight: "bold",
            color: isDark ? Secondary[50] : Secondary[900],
          }}
        >
          {title}
        </Animated.Text>
        <Animated.View
          style={{
            opacity: metaOpacity,
            maxHeight: metaHeight,
            overflow: "visible",
          }}
        >
          <Text
            numberOfLines={1}
            className="text-base text-secondary-600 dark:text-secondary-50"
          >
            {description}
          </Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
