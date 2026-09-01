import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect } from "react";
import { Modal, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

type Props = {
  visible: boolean;
  uri: string | undefined;
  onClose: () => void;
};

// Fullscreen pinch/pan/double-tap image viewer used to zoom into quiz images. Gestures live in
// their own GestureHandlerRootView because React Native Modals render in a separate native view
// tree that the app-root handler doesn't reach.
export function ImageZoomViewer({ visible, uri, onClose }: Props) {
  const { width, height } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // Focal point of the current pinch, relative to the image centre, so zoom grows toward the fingers.
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Reset the transform each time the viewer opens so it always starts at 1x, centered.
  useEffect(() => {
    if (visible) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [visible]);

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      focalX.value = e.focalX - width / 2;
      focalY.value = e.focalY - height / 2;
    })
    .onUpdate((e) => {
      const next = Math.min(Math.max(savedScale.value * e.scale, 1), MAX_SCALE);
      // Keep the pinch focal point stationary as the image scales (zoom toward the fingers).
      const delta = next - savedScale.value;
      translateX.value = savedTranslateX.value - focalX.value * (delta / savedScale.value);
      translateY.value = savedTranslateY.value - focalY.value * (delta / savedScale.value);
      scale.value = next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .maxPointers(2)
    .onUpdate((e) => {
      // Panning only makes sense once zoomed in; at 1x the image fills the frame.
      if (scale.value <= 1) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  // Pinch always runs; double-tap wins over pan when both could fire.
  const composed = Gesture.Simultaneous(pinch, Gesture.Exclusive(doubleTap, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <GestureDetector gesture={composed}>
            {/* collapsable={false} stops Android from flattening this view away, which would
                detach the gesture handler and break pinch/pan. */}
            <Animated.View
              collapsable={false}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              {uri ? (
                <Animated.Image
                  source={{ uri }}
                  style={[{ width, height }, animatedStyle]}
                  resizeMode="contain"
                />
              ) : null}
            </Animated.View>
          </GestureDetector>

          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, right: 0 }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="m-3 h-10 w-10 items-center justify-center rounded-full bg-white/15"
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
