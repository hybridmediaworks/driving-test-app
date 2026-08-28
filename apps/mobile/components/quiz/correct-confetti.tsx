import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";

/**
 * Celebration effects for a correctly-answered option — the React Native counterparts to the web
 * quiz (apps/web/components/state/quiz/QuestionCard.tsx + the `correct-glow` keyframes in
 * apps/web/app/globals.css), rebuilt on the Animated API (native-driven, no extra dependency) so
 * they look and behave the same on device. Both are `pointerEvents="none"` and honor the OS
 * "reduce motion" setting.
 */

const PALETTE = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#eab308", "#8b5cf6", "#06b6d4", "#ec4899"];
const COUNT = 60;
const SIM_FRAMES = 60; // integration steps — matches the web canvas loop
const SAMPLES = 14; // points sampled from each path for the native interpolation
const SCALE = 1.2; // px scale so the spray reads well around the ~32px letter badge

type Particle = { xs: number[]; ys: number[]; size: number; color: string; spin: number };

// Same physics as the web canvas burst: a radial spray with an upward bias (vy - 4), per-particle
// gravity, and spin. The parabolic path is integrated once in JS and sampled into a multi-point
// interpolation, so the motion is a real gravity arc (not a mechanical up-then-down), driven
// natively for a smooth 60fps burst.
function makeParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    let x = 0;
    let y = 0;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed - 4;
    const g = 0.14 + Math.random() * 0.08;
    const pathX: number[] = [];
    const pathY: number[] = [];
    for (let f = 0; f <= SIM_FRAMES; f++) {
      pathX.push(x);
      pathY.push(y);
      vy += g;
      x += vx;
      y += vy;
    }
    const xs: number[] = [];
    const ys: number[] = [];
    for (let k = 0; k < SAMPLES; k++) {
      const f = Math.round((k / (SAMPLES - 1)) * SIM_FRAMES);
      xs.push(pathX[f] * SCALE);
      ys.push(pathY[f] * SCALE);
    }
    return {
      xs,
      ys,
      size: 4 + Math.random() * 4,
      color: PALETTE[i % PALETTE.length],
      spin: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 540),
    };
  });
}

const INPUT = Array.from({ length: SAMPLES }, (_, k) => k / (SAMPLES - 1));

function useReduceMotion(): boolean | null {
  const [reduce, setReduce] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReduce(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return reduce;
}

export function CorrectConfetti() {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const particles = useRef(makeParticles()).current;

  useEffect(() => {
    if (reduce !== false) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear, // the arc lives in the sampled path; play it at constant time
      useNativeDriver: true,
    }).start();
  }, [reduce, progress]);

  if (reduce !== false) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: "50%", top: "50%", zIndex: 10 }}
    >
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 0.6,
            borderRadius: 1,
            backgroundColor: p.color,
            opacity: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.9, 0] }),
            transform: [
              { translateX: progress.interpolate({ inputRange: INPUT, outputRange: p.xs }) },
              { translateY: progress.interpolate({ inputRange: INPUT, outputRange: p.ys }) },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${p.spin}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

/**
 * The `.correct-glow` pulse from web (globals.css): a quick, light green glow around the correct
 * answer box when it's picked right — 900ms, rises to a soft peak at ~35% then fades. Rendered as
 * an absolutely-positioned ring that fills the option; parent must be `position: relative` (the
 * default for RN views) and pass a matching `radius`.
 */
export function CorrectGlow({ radius = 12 }: { radius?: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce !== false) return;
    Animated.timing(v, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [reduce, v]);

  if (reduce !== false) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: -2,
        right: -2,
        top: -2,
        bottom: -2,
        borderRadius: radius + 2,
        borderWidth: 2,
        borderColor: "#22c55e",
        opacity: v.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.7, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.98, 1.03, 1] }) }],
      }}
    />
  );
}
