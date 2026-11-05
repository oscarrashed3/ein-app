import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { Mark } from "./Mark";
import { T } from "./T";
import { c, ease, f } from "../theme";

/** Every time the app opens: ILN's mark on navy, one line from ILN, then it fades into the app. Tap to skip. */
export function Opening() {
  const [on, setOn] = useState(true);
  const reduce = useReducedMotion();
  const mark = useSharedValue(0), line = useSharedValue(0), out = useSharedValue(1);
  useEffect(() => {
    mark.value = withTiming(1, { duration: reduce ? 200 : 700, easing: ease });
    line.value = withDelay(reduce ? 100 : 450, withTiming(1, { duration: 700, easing: ease }));
    out.value = withDelay(2300, withTiming(0, { duration: 520, easing: ease }));
    const t = setTimeout(() => setOn(false), 2900);
    return () => clearTimeout(t);
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: out.value }));
  const m = useAnimatedStyle(() => ({ opacity: mark.value, transform: [{ translateY: (1 - mark.value) * 12 }, { scale: 0.96 + mark.value * 0.04 }] }));
  const l = useAnimatedStyle(() => ({ opacity: line.value, transform: [{ translateY: (1 - line.value) * 8 }] }));
  if (!on) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.f, a]}>
      <Pressable style={st.p} onPress={() => setOn(false)} accessibilityRole="button" accessibilityLabel="ILN. Every decision starts as a conversation. Tap to continue">
        <Animated.View style={m}>
          <Mark width={132} />
        </Animated.View>
        <Animated.View style={[st.q, l]}>
          <View style={st.rule} />
          <T style={st.t}>Every decision starts{"\n"}as a conversation.</T>
          <T style={st.by}>Institute LN</T>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  f: { backgroundColor: c.navy, zIndex: 100 },
  p: { flex: 1, alignItems: "center", justifyContent: "center", gap: 36, padding: 32 },
  q: { alignItems: "center", gap: 12 },
  rule: { width: 28, height: 2, borderRadius: 1, backgroundColor: c.gold },
  t: { fontFamily: f.medium, fontSize: 22, lineHeight: 30, letterSpacing: -0.4, color: c.white, textAlign: "center" },
  by: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 1.6, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" },
});
