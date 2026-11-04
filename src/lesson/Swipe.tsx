import { useMemo, useRef, useState } from "react";
import { PanResponder, Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming, Extrapolation } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { T } from "../components/T";
import { Press } from "../components/Press";
import { Appear } from "../components/Appear";
import { Back, Arrow } from "../components/Icons";
import { c, ease, f, g } from "../theme";
import { XP, type Step } from "../content/level1";
import type { StepProps } from "./types";

type S = Extract<Step, { k: "swipe" }>;
const THROW = 110;

/** Sort thoughts by swiping cards left or right (or tapping the two buttons). Each card tells you why. */
export function Swipe({ step, report, locked }: StepProps<S>) {
  const [i, setI] = useState(0);
  const [verdict, setVerdict] = useState<{ ok: boolean; why: string; n: number } | null>(null);
  const right = useRef(0);
  const x = useSharedValue(0);
  const busy = useRef(false);

  const decide = (side: "left" | "right") => {
    if (busy.current || i >= step.cards.length) return;
    busy.current = true;
    const card = step.cards[i];
    const ok = card.side === side;
    if (ok) right.current += 1;
    if (Platform.OS !== "web") Haptics.impactAsync(ok ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    x.value = withTiming(side === "right" ? 520 : -520, { duration: 240, easing: ease });
    setVerdict({ ok, why: card.why, n: i });
    setTimeout(() => {
      x.value = 0;
      busy.current = false;
      const next = i + 1;
      setI(next);
      if (next >= step.cards.length) {
        const all = right.current === step.cards.length;
        const xp = right.current * 5;
        report({
          ok: all,
          xp,
          right: right.current,
          total: step.cards.length,
          sheet: { tone: all ? "ok" : "info", title: all ? `All ${step.cards.length} sorted.` : `${right.current} of ${step.cards.length} sorted.`, body: all ? "Sharp. You can hear the difference." : "Look back at the ones you missed next time you're in that situation.", xp },
        });
      }
    }, 260);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 6,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gs) => {
          if (!busy.current) x.value = gs.dx;
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dx > THROW || gs.vx > 0.6) decide("right");
          else if (gs.dx < -THROW || gs.vx < -0.6) decide("left");
          else x.value = withSpring(0, { damping: 16, stiffness: 180 });
        },
        onPanResponderTerminate: () => (x.value = withSpring(0)),
      }),
    [i],
  );

  const top = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: Math.abs(x.value) * 0.06 }, { rotate: `${interpolate(x.value, [-300, 300], [-12, 12], Extrapolation.CLAMP)}deg` }],
  }));
  const under = useAnimatedStyle(() => {
    const p = interpolate(Math.abs(x.value), [0, 200], [0, 1], Extrapolation.CLAMP);
    return { transform: [{ scale: 0.94 + p * 0.06 }, { translateY: 14 - p * 14 }], opacity: 0.6 + p * 0.4 };
  });
  const rightTag = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [20, 110], [0, 1], Extrapolation.CLAMP) }));
  const leftTag = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-110, -20], [1, 0], Extrapolation.CLAMP) }));

  const left = step.cards.length - i;
  return (
    <View style={{ gap: 22 }}>
      <Appear>
        <T v="h1" style={{ fontSize: 25, lineHeight: 31 }}>{step.prompt}</T>
      </Appear>

      <View style={s.deck}>
        {i + 1 < step.cards.length && (
          <Animated.View style={[s.card, s.cardUnder, under]}>
            <T style={s.cardT}>{step.cards[i + 1].text}</T>
          </Animated.View>
        )}
        {i < step.cards.length ? (
          <Animated.View key={i} entering={FadeIn.duration(200)} style={[s.card, top]} {...pan.panHandlers}>
            <Animated.View style={[s.tag, s.tagR, rightTag]}>
              <T style={[s.tagT, { color: c.mintDeep }]}>{step.right}</T>
            </Animated.View>
            <Animated.View style={[s.tag, s.tagL, leftTag]}>
              <T style={[s.tagT, { color: c.purpleDeep }]}>{step.left}</T>
            </Animated.View>
            <T style={s.cardT}>{step.cards[i].text}</T>
            <T style={s.count}>
              {i + 1} of {step.cards.length}
            </T>
          </Animated.View>
        ) : (
          <View style={[s.card, s.cardDone]}>
            <T style={[s.cardT, { color: c.ink2 }]}>Deck sorted.</T>
          </View>
        )}
      </View>

      <View style={s.verdict}>
        {verdict && (
          <Animated.View key={verdict.n} entering={FadeInDown.duration(260).easing(ease)} style={s.vRow}>
            <View style={[s.vMark, { backgroundColor: verdict.ok ? c.mint : c.purple }]} />
            <T style={s.vT}>
              <T style={[s.vH, { color: verdict.ok ? c.mintDeep : c.purpleDeep }]}>{verdict.ok ? "Right. " : "Other way. "}</T>
              {verdict.why}
            </T>
          </Animated.View>
        )}
      </View>

      <View style={s.btns}>
        <Press disabled={locked || left === 0} onPress={() => decide("left")} style={[s.btn, { borderColor: c.purple }]} accessibilityRole="button" accessibilityLabel={step.left}>
          <Back color={c.purpleDeep} size={18} />
          <T style={[s.btnT, { color: c.purpleDeep }]}>{step.left}</T>
        </Press>
        <Press disabled={locked || left === 0} onPress={() => decide("right")} style={[s.btn, { borderColor: c.mint }]} accessibilityRole="button" accessibilityLabel={step.right}>
          <T style={[s.btnT, { color: c.mintDeep }]}>{step.right}</T>
          <Arrow color={c.mintDeep} size={18} />
        </Press>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  deck: { height: 250 },
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: c.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: c.line,
    padding: g + 4,
    justifyContent: "center",
    shadowColor: c.navy,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    cursor: "grab",
    userSelect: "none",
    touchAction: "pan-y",
  } as any,
  cardUnder: { shadowOpacity: 0.04 },
  cardDone: { borderStyle: "dashed", shadowOpacity: 0, backgroundColor: "transparent", alignItems: "center" },
  cardT: { userSelect: "none", fontFamily: f.semibold, fontSize: 26, lineHeight: 33, letterSpacing: -0.8, color: c.navy },
  count: { position: "absolute", left: g + 4, bottom: 16, fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.grey },
  tag: { borderRadius: 999, position: "absolute", top: 16, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5 },
  tagR: { left: 16, borderColor: c.mint, transform: [{ rotate: "-6deg" }] },
  tagL: { right: 16, borderColor: c.purple, transform: [{ rotate: "6deg" }] },
  tagT: { fontFamily: f.semibold, fontSize: 13, lineHeight: 16, letterSpacing: 1, textTransform: "uppercase" },
  verdict: { minHeight: 48 },
  vRow: { flexDirection: "row", gap: 12 },
  vMark: { width: 3 },
  vT: { flex: 1, fontSize: 14, lineHeight: 21, color: c.ink },
  vH: { fontFamily: f.semibold, fontSize: 14, lineHeight: 21 },
  btns: { flexDirection: "row", gap: 8 },
  btn: { borderRadius: 999, flex: 1, height: 56, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: c.white },
  btnT: { fontFamily: f.semibold, fontSize: 15, lineHeight: 20 },
});
