import { Primary, Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type ProgressBarProps = {
  percent: number;
};

export function ProgressBar({ percent }: ProgressBarProps) {
  const isDark = useIsDark();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className="py-5">
      <View className="h-14 rounded-full overflow-hidden bg-secondary-200 dark:bg-secondary-700 items-center justify-center relative">
        <Animated.View
          className="absolute left-0 top-0 h-full"
          style={{ width: widthInterpolated }}
        >
          <LinearGradient
            colors={[Primary.DEFAULT, isDark ? Secondary[700] : Secondary[200]]}
            locations={[0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Text className="text-lg font-bold text-secondary dark:text-secondary-50">
          {percent}%
        </Text>
      </View>
    </View>
  );
}
