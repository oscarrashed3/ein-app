import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { T } from "../components/T";
import { Button } from "../components/Button";
import { Close, Lock } from "../components/Icons";
import { Rise } from "../components/Rise";
import { lessons, type Step } from "../content/level1";
import { LEVELS } from "../content/levels";
import { useProgress } from "../state/progress";
import { c, ease, f, g, glass } from "../theme";
import { MODULE_COLOUR, ZONES, colourHex } from "../world/world";
import type { StopState, World } from "./World";

/**
 * Where you are: a small, quiet label under the top bar. It changes as you walk into each area,
 * so every part of the level reads clearly without a card in the way.
 */
export function ZoneTitle({ world, top }: { world: World; top: number }) {
  const [z, setZ] = useState(0);
  const o = useSharedValue(0);
  useEffect(() => {
    const iv = setInterval(() => {
      const n = world.zoneInView();
      setZ((p) => {
        if (p !== n) o.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 520, easing: ease }));
        return n;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [world]);
  const a = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: (1 - o.value) * -6 }] }));
  if (!z) return null;
  const zone = z <= 3 ? ZONES[z - 1] : null;
  const col = zone ? colourHex[MODULE_COLOUR[zone.n]] : c.purple;
  return (
    <Animated.View style={[st.zt, { top }, a]} pointerEvents="none">
      <View style={[st.ztPill, glass()]}>
        <View style={[st.ztDot, { backgroundColor: col }]} />
        <T style={st.ztK}>{zone ? `Level 1 · Quiet Shore` : `Level 2 · ${LEVELS[1].place}`}</T>
        <T style={st.ztT}>{zone ? zone.name : "Locked"}</T>
      </View>
    </Animated.View>
  );
}

/** Tap a stop: its lesson, in a small glass card. Locked stops say what opens them. */
export function StopCard({ id, state, onClose }: { id: string; state: StopState; onClose: () => void }) {
  const { s } = useProgress();
  const l = lessons.find((q) => q.id === id)!;
  const i = lessons.indexOf(l);
  const zone = ZONES[l.module - 1];
  const col = colourHex[MODULE_COLOUR[l.module]];
  const rp = l.steps.find((x): x is Extract<Step, { k: "roleplay" }> => x.k === "roleplay");
  const prev = lessons[i - 1];
  const d = s.done[id];
  const label = state === "done" ? "Do it again" : l.practice ? "Sit by the fire" : "Start";
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <Rise y={16} style={[st.card, glass(col)]}>
        <View style={st.top}>
          <View style={[st.dot, { backgroundColor: col }]} />
          <T style={st.k} numberOfLines={1}>
            {zone.name} · {l.practice ? "Campfire" : `Stop ${lessons.filter((q) => q.module === l.module && !q.practice).indexOf(l) + 1}`}
          </T>
          <T style={[st.k, { flexShrink: 0 }]}>{l.minutes} min</T>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Close size={18} color={c.ink2} />
          </Pressable>
        </View>
        <T style={st.t}>{l.title}</T>
        {rp && <T style={st.s}>Sit with {rp.who.name}, {rp.who.role.toLowerCase()}.</T>}
        {state === "locked" ? (
          <View style={st.lock}>
            <Lock size={16} color={c.ink2} />
            <T style={st.s2}>Opens after “{prev?.title}”.</T>
          </View>
        ) : (
          <>
            {d && <T style={st.s2}>Done · {d.right}/{d.total} right · +{d.xp} XP</T>}
            <Button label={label} kind={state === "done" ? "ghost" : "primary"} onPress={() => (onClose(), router.push(`/lesson/${id}`))} />
          </>
        )}
      </Rise>
    </View>
  );
}

const st = StyleSheet.create({
  zt: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  ztPill: { flexDirection: "row", alignItems: "center", gap: 8, height: 32, borderRadius: 16, paddingHorizontal: 14 },
  ztDot: { width: 7, height: 7, borderRadius: 4 },
  ztK: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.ink2 },
  ztT: { fontFamily: f.semibold, fontSize: 13, lineHeight: 17, color: c.navy },
  card: { position: "absolute", left: 12, right: 12, bottom: 12, borderRadius: 24, padding: g, gap: 10, maxWidth: 496, alignSelf: "center" },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  k: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.ink2, flexShrink: 1, flexGrow: 1 },
  t: { fontFamily: f.semibold, fontSize: 21, lineHeight: 26, letterSpacing: -0.5, color: c.navy },
  s: { fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: -4 },
  s2: { fontFamily: f.medium, fontSize: 13, lineHeight: 18, color: c.ink2 },
  lock: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
});
