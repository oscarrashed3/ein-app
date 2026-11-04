import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { c, ease } from "../theme";

/** Thin progress bar that grows to `value` (0..1). */
export function Bar({ value, color = c.navy, track = c.paper2, height = 4, delay = 200 }: { value: number; color?: string; track?: string; height?: number; delay?: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withTiming(value, { duration: 900, easing: ease }));
  }, [value]);
  const a = useAnimatedStyle(() => ({ width: `${v.value * 100}%` }));
  return (
    <View style={[s.t, { backgroundColor: track, height }]}>
      <Animated.View style={[s.b, { backgroundColor: color }, a]} />
    </View>
  );
}
const s = StyleSheet.create({ t: { overflow: "hidden" }, b: { height: "100%" } });
