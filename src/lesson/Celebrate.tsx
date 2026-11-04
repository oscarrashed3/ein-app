import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutUp, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, Easing } from "react-native-reanimated";
import { T } from "../components/T";
import { Mark } from "../components/Mark";
import { Week } from "../components/Week";
import { Button } from "../components/Button";
import { c, ease, f, g } from "../theme";
import { DAILY_GOAL } from "../state/progress";
import { Leon, type LeonHandle } from "../components/Leon";
import { useRef } from "react";

/** Counts a number up from `from` to `to`, quickly, ease-out. */
function useCount(to: number, from = 0, delay = 300, ms = 900) {
  const [n, setN] = useState(from);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now() + delay;
    const tick = () => {
      const p = Math.min(1, Math.max(0, (Date.now() - t0) / ms));
      setN(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return n;
}

/** Lesson results: XP earned, accuracy, and (after a role-play) where their side ended. */
export function Results({ title, xp, right, total, meter, todayXp, onNext, cta }: { title: string; xp: number; right: number; total: number; meter?: number; todayXp: number; onNext: () => void; cta: string }) {
  const n = useCount(xp);
  const acc = total ? Math.round((right / total) * 100) : 100;
  const goalHit = todayXp >= DAILY_GOAL;
  const tiles = [
    { k: "XP earned", v: `+${n}`, tone: c.gold },
    meter !== undefined ? { k: "Their side", v: `${meter}`, tone: c.mint } : { k: "Accuracy", v: `${acc}%`, tone: c.mint },
    { k: "Daily goal", v: goalHit ? "Done" : `${todayXp}/${DAILY_GOAL}`, tone: c.purple },
  ];
  return (
    <View style={{ flex: 1, gap: 32, paddingTop: 12 }}>
      <Animated.View entering={FadeInDown.duration(520).easing(ease)} style={{ gap: 12 }}>
        <T v="small">Lesson complete</T>
        <T v="display">{title}</T>
      </Animated.View>
      <View style={s.tiles}>
        {tiles.map((t, i) => (
          <Animated.View key={t.k} entering={FadeInDown.duration(480).delay(200 + i * 80).easing(ease)} style={s.tile}>
            <View style={[s.tileBar, { backgroundColor: t.tone }]} />
            <T style={s.tileV}>{t.v}</T>
            <T v="small">{t.k}</T>
          </Animated.View>
        ))}
      </View>
      <View style={{ marginTop: "auto" }}>
        <Button label={cta} onPress={onNext} />
      </View>
    </View>
  );
}

/** The streak moment: the three ILN shapes fly in and lock together, then the day count rolls over. */
export function StreakMoment({ prev, streak, days, onDone }: { prev: number; streak: number; days: string[]; onDone: () => void }) {
  const [shown, setShown] = useState(prev);
  const leon = useRef<LeonHandle>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setShown(streak);
      leon.current?.emote("jump");
    }, 1100);
    const t2 = setTimeout(() => leon.current?.emote("wow"), 2200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);
  return (
    <View style={s.streak}>
      <View style={s.markWrap}>
        <Leon ref={leon} mood="proud" size={230} ground={false} />
      </View>
      <View style={s.numRow}>
        <View style={s.numClip}>
          <Animated.Text key={shown} entering={shown === prev ? FadeIn.duration(1) : SlideInDown.duration(520).easing(ease)} exiting={SlideOutUp.duration(360).easing(ease)} style={s.num}>
            {shown}
          </Animated.Text>
        </View>
        <Animated.View entering={FadeInDown.duration(480).delay(1300).easing(ease)} style={{ flex: 1, gap: 4 }}>
          <T style={s.h}>{streak === 1 ? "Day one." : `${streak} days in a row.`}</T>
          <T style={s.sub}>{streak === 1 ? "Come back tomorrow and it becomes a streak." : "That's how a skill becomes a habit."}</T>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.duration(480).delay(1450).easing(ease)}>
        <Week days={days} dark />
      </Animated.View>
      <Animated.View entering={FadeIn.duration(400).delay(1700)} style={{ marginTop: "auto" }}>
        <Button label="Continue" kind="light" onPress={onDone} />
      </Animated.View>
    </View>
  );
}

const FROM = [
  { x: -180, y: -120, r: -40 },
  { x: 0, y: 220, r: 30 },
  { x: 190, y: -140, r: 50 },
];
function Piece({ i }: { i: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(150 + i * 110, withSpring(1, { damping: 13, stiffness: 110, mass: 0.9 }));
  }, []);
  const a = useAnimatedStyle(() => {
    const k = 1 - p.value;
    return { opacity: Math.min(1, p.value * 2), transform: [{ translateX: FROM[i].x * k }, { translateY: FROM[i].y * k }, { rotate: `${FROM[i].r * k}deg` }, { scale: 0.7 + 0.3 * p.value }] };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, a]}>
      <Mark width={220} only={i} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  tiles: { flexDirection: "row", gap: 8 },
  tile: { borderRadius: 20, flex: 1, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, padding: 14, paddingTop: 18, gap: 4 },
  tileBar: { position: "absolute", left: 0, right: 0, top: 0, height: 3 },
  tileV: { fontFamily: f.semibold, fontSize: 24, lineHeight: 30, letterSpacing: -0.8, color: c.navy },
  streak: { flex: 1, backgroundColor: c.navy, paddingHorizontal: g, paddingTop: 120, paddingBottom: 36, gap: 28 },
  markWrap: { width: 230, height: 138, marginBottom: 8, alignSelf: "center", alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: c.mint, opacity: 0.16, transform: [{ scaleY: 0.6 }] },
  numRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  numClip: { height: 96, overflow: "hidden", justifyContent: "center", minWidth: 70 },
  num: { fontFamily: f.semibold, fontSize: 92, lineHeight: 96, letterSpacing: -5, color: c.mint },
  h: { fontFamily: f.semibold, fontSize: 22, lineHeight: 27, letterSpacing: -0.5, color: c.white },
  sub: { fontSize: 14, lineHeight: 20, color: c.onNavy2 },
});
