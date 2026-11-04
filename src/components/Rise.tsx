import { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { ease } from "../theme";

/** Fades and lifts in on mount without a layout animation, so it is safe inside growing lists. */
export function Rise({ children, style, delay = 0, y = 10 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; delay?: number; y?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 340, easing: ease }));
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * y }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}
