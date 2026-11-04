import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ease } from "../theme";

const AP = Animated.createAnimatedComponent(Pressable);

/** Pressable that gives a quick, small press (scale 0.97) and springs back. */
export function Press({ style, children, disabled, ...p }: PressableProps & { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const sc = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <AP
      {...p}
      disabled={disabled}
      onPressIn={(e) => {
        sc.value = withTiming(0.97, { duration: 90, easing: ease });
        p.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        sc.value = withTiming(1, { duration: 220, easing: ease });
        p.onPressOut?.(e);
      }}
      style={[style, a]}
    >
      {children}
    </AP>
  );
}
