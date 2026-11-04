import { useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withTiming, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { T } from "../components/T";
import { Press } from "../components/Press";
import { Appear } from "../components/Appear";
import { c, ease, f } from "../theme";
import type { Step } from "../content/level1";
import type { StepProps } from "./types";

type S = Extract<Step, { k: "order" }>;

function shuffle<T>(a: T[]) {
  // Stable shuffle, so the puzzle looks the same each time you open it.
  const r = [...a];
  let seed = 7;
  for (let i = r.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Build a sequence: tap the next step. Right taps lock into place; wrong taps shake. */
export function Order({ step, report, locked }: StepProps<S>) {
  const pool = useMemo(() => shuffle(step.items), [step]);
  const [placed, setPlaced] = useState<string[]>([]);
  const misses = useRef(0);

  const tap = (item: string, shake: () => void) => {
    const want = step.items[placed.length];
    if (item !== want) {
      misses.current += 1;
      shake();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const next = [...placed, item];
    setPlaced(next);
    if (next.length === step.items.length) {
      const m = misses.current;
      const xp = Math.max(10, 40 - m * 5);
      report({ ok: m === 0, xp, right: m === 0 ? 1 : 0, total: 1, sheet: { tone: m === 0 ? "ok" : "info", title: m === 0 ? "Perfect order." : `Done, with ${m} ${m === 1 ? "slip" : "slips"}.`, body: step.why, xp } });
    }
  };

  return (
    <View style={{ gap: 20 }}>
      <Appear>
        <T v="h1" style={{ fontSize: 25, lineHeight: 31 }}>{step.prompt}</T>
      </Appear>

      <View style={s.slots}>
        {step.items.map((_, i) => {
          const it = placed[i];
          return (
            <View key={i} style={[s.slot, !!it && s.slotOn, i === placed.length && s.slotNext]}>
              <T style={[s.n, !!it && { color: c.mint }]}>{i + 1}</T>
              {it ? (
                <Animated.View entering={ZoomIn.duration(260).easing(ease).withInitialValues({ transform: [{ scale: 0.92 }] })} style={{ flex: 1 }}>
                  <T style={s.slotT}>{it}</T>
                </Animated.View>
              ) : (
                <View style={s.blank} />
              )}
            </View>
          );
        })}
      </View>

      <View style={s.pool}>
        {pool
          .filter((p) => !placed.includes(p))
          .map((p) => (
            <Chip key={p} label={p} disabled={locked} onTap={(shake) => tap(p, shake)} />
          ))}
      </View>
    </View>
  );
}

function Chip({ label, disabled, onTap }: { label: string; disabled: boolean; onTap: (shake: () => void) => void }) {
  const x = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const shake = () => {
    x.value = withSequence(withTiming(-7, { duration: 50 }), withTiming(7, { duration: 60 }), withTiming(-4, { duration: 60 }), withTiming(0, { duration: 60 }));
  };
  return (
    <Animated.View layout={LinearTransition.duration(260).easing(ease)} entering={FadeIn.duration(200)} style={a}>
      <Press disabled={disabled} onPress={() => onTap(shake)} style={s.chip} accessibilityRole="button">
        <T style={s.chipT}>{label}</T>
      </Press>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  slots: { gap: 4 },
  slot: { borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 12, height: 34, paddingHorizontal: 10, borderWidth: 1, borderColor: c.line, borderStyle: "dashed" },
  slotOn: { backgroundColor: c.navy, borderColor: c.navy, borderStyle: "solid" },
  slotNext: { borderColor: c.navy },
  n: { fontFamily: f.semibold, fontSize: 12, lineHeight: 16, color: c.grey, width: 14 },
  slotT: { fontFamily: f.medium, fontSize: 13, lineHeight: 17, color: c.white },
  blank: { flex: 1 },
  pool: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, shadowColor: c.navy, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  chipT: { fontFamily: f.medium, fontSize: 13, lineHeight: 17, color: c.ink },
});
