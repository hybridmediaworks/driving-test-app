import { Error, Primary, Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { Circle, Svg } from "react-native-svg";
import { Heading } from "./heading";

const SIZE = 200;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type DonutChartProps = {
  percentage: number;
  correct: number;
  incorrect: number;
};

export function DonutChart({
  percentage,
  correct,
  incorrect,
}: DonutChartProps) {
  const isDark = useIsDark();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const bgColor = isDark ? Secondary[900] : White.DEFAULT;

  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
        {/* Background ring (red = incorrect) */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={Error[400]}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress ring (green = correct) */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={Primary[400]}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      {/* Inner text */}
      <View
        style={{
          width: SIZE - STROKE * 2 - 8,
          height: SIZE - STROKE * 2 - 8,
          borderRadius: (SIZE - STROKE * 2 - 8) / 2,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Heading>{percentage}%</Heading>
        <Text className="text-secondary-500 dark:text-secondary-200">
          {correct} correct
        </Text>
        <Text className="text-secondary-500 dark:text-secondary-200">
          {incorrect} incorrect
        </Text>
      </View>
    </View>
  );
}
