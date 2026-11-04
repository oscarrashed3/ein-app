import { StyleSheet, View } from "react-native";
import Animated, { FadeOut, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "../components/T";
import { Button } from "../components/Button";
import { Check } from "../components/Icons";
import { c, f, g } from "../theme";
import { Easing } from "react-native-reanimated";

export type SheetData = { tone: "ok" | "no" | "info"; title: string; body?: string; xp?: number; cta?: string };

const drawer = Easing.bezier(0.32, 0.72, 0, 1);

/** Answer feedback rises from the bottom, the same way every time, and always carries the next step. */
export function Sheet({ d, onNext }: { d: SheetData; onNext: () => void }) {
  const i = useSafeAreaInsets();
  const bg = d.tone === "ok" ? c.mintTint : d.tone === "no" ? c.lilac : c.white;
  const ink = d.tone === "ok" ? c.mintDeep : d.tone === "no" ? c.purpleDeep : c.navy;
  const bar = d.tone === "ok" ? c.mint : d.tone === "no" ? c.purple : c.navy;
  return (
    <Animated.View entering={SlideInDown.duration(380).easing(drawer)} exiting={FadeOut.duration(120)} style={[s.sheet, { backgroundColor: bg, paddingBottom: Math.max(i.bottom, 16) + 4 }]}>
      <View style={[s.edge, { backgroundColor: bar }]} />
      <View style={s.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={s.head}>
            {d.tone === "ok" && <Check color={ink} size={18} />}
            <T style={[s.title, { color: ink }]}>{d.title}</T>
          </View>
          {!!d.body && <T style={s.body}>{d.body}</T>}
        </View>
        {!!d.xp && (
          <View style={[s.xp, { borderColor: bar }]}>
            <T style={[s.xpT, { color: ink }]}>+{d.xp}</T>
            <T style={[s.xpL, { color: ink }]}>XP</T>
          </View>
        )}
      </View>
      <Button label={d.cta ?? "Continue"} onPress={onNext} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: g, paddingTop: 20, gap: 16, shadowColor: c.navy, shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: -8 } },
  edge: { position: "absolute", left: 0, right: 0, top: 0, height: 3 },
  row: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: f.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontSize: 14, lineHeight: 21, color: c.ink },
  xp: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  xpT: { fontFamily: f.semibold, fontSize: 17, lineHeight: 20 },
  xpL: { fontFamily: f.medium, fontSize: 9, lineHeight: 11, letterSpacing: 1 },
});
