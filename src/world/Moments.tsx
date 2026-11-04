import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useReducedMotion } from "react-native-reanimated";
import { Rise } from "../components/Rise";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Leon, type LeonHandle } from "../components/Leon";
import { T } from "../components/T";
import { Button } from "../components/Button";
import { c, ease, f, g } from "../theme";
import type { Skin } from "../state/progress";
import { ZONES } from "./world";

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Zone arrival: a full-bleed title moment, about 1.6 seconds. Tap to skip. */
export function ZoneArrival({ zone, onDone }: { zone: 1 | 2 | 3; onDone: () => void }) {
  const z = ZONES[zone - 1];
  const { width } = useWindowDimensions();
  const leon = useRef<LeonHandle>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const a = setTimeout(() => leon.current?.emote("wow"), 450);
    const b = setTimeout(onDone, reduce ? 2200 : 1900);
    return () => (clearTimeout(a), clearTimeout(b));
  }, []);
  const size = clamp(Math.min(width, 480) * 0.13, 40, 60);
  return (
    <Rise y={0} style={[StyleSheet.absoluteFill, st.full, { backgroundColor: c.paper }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDone} accessibilityRole="button" accessibilityLabel={`${z.name}. Tap to continue`}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="za" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={z.leak[0]} stopOpacity={0.6} />
              <Stop offset="0.6" stopColor={z.leak[1]} stopOpacity={0.25} />
              <Stop offset="1" stopColor={z.leak[1]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="60%" cy="40%" rx="90%" ry="22%" fill="url(#za)" transform={`rotate(-18 ${width * 0.6} 300)`} />
        </Svg>
        <View style={st.center} pointerEvents="none">
          <Rise delay={80}>
            <T style={st.kicker}>Zone {zone} of 3 · Quiet Shore</T>
          </Rise>
          <Rise delay={140}>
            <T style={[st.huge, { fontSize: size, lineHeight: size * 1.04 }]}>{z.name.replace("The ", "The\n")}</T>
          </Rise>
          <Landmark zone={zone} />
          <Rise delay={320} style={{ maxWidth: 320 }}>
            <T style={st.sub}>{z.landmark}</T>
            <T style={[st.sub, { color: c.ink2, marginTop: 4 }]}>{z.module}</T>
          </Rise>
          <Rise delay={260} y={0} style={{ alignSelf: "flex-end", marginTop: 8 }}>
            <Leon ref={leon} mood="curious" size={150} ground={false} interactive={false} />
          </Rise>
        </View>
        <T style={st.skip}>Tap to continue</T>
      </Pressable>
    </Rise>
  );
}

/** The zone's landmark, drawn in piece by piece. */
function Landmark({ zone }: { zone: 1 | 2 | 3 }) {
  const n = zone === 1 ? 7 : zone === 2 ? 5 : 3;
  const col = zone === 1 ? c.gold : zone === 2 ? c.purple : c.mint;
  return (
    <View style={st.mark}>
      {Array.from({ length: n }, (_, i) => (
        <Rise key={i} delay={200 + i * 45}>
          <Svg width={zone === 2 ? 40 : 34} height={34} viewBox="0 0 40 34">
            {zone === 1 && <Ellipse cx={20} cy={20} rx={15} ry={11} fill={i === 0 ? col : "#E9E1D2"} />}
            {zone === 2 && <Rect x={2} y={12} width={36} height={12} rx={4} fill={i === 0 ? col : "#E9E1D2"} />}
            {zone === 3 && (
              <>
                <Circle cx={20} cy={18} r={14} fill={i === 0 ? col : "#E9E1D2"} />
                <Path d={["M12 13l5-2 6 2 5-2v10l-5 2-6-2-5 2z", "M24 12l-3 7-7 3 3-7z", "M16 10h8M15 13h10l-1 10h-8z"][i]} stroke={i === 0 ? c.navy : "#A49B8B"} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
              </>
            )}
          </Svg>
        </Rise>
      ))}
    </View>
  );
}

/**
 * Leon earns a colour. He starts in his old skin and the new colour runs down him, head first.
 * After Module 3 he can finally change colour: all three are his, and Level 1 is done.
 */
export function ColourEarned({ from, to, module, onDone }: { from: Skin; to: Skin; module: number; onDone: () => void }) {
  const [skin, setSkin] = useState<Skin>(from);
  const leon = useRef<LeonHandle>(null);
  const i = useSafeAreaInsets();
  useEffect(() => {
    const a = setTimeout(() => {
      setSkin(to);
      leon.current?.emote("jump");
    }, 650);
    const b = setTimeout(() => leon.current?.emote("wow"), 1500);
    return () => (clearTimeout(a), clearTimeout(b));
  }, []);
  const all = to === "all";
  const name = { gold: "gold", purple: "purple", mint: "mint", all: "all three colours", unaware: "" }[to];
  const col = to === "gold" ? c.gold : to === "purple" ? c.purple : to === "mint" ? c.mint : c.gold;
  return (
    <Rise y={0} style={[StyleSheet.absoluteFill, st.full, { backgroundColor: all ? c.navy : c.paper, paddingTop: i.top + 40, paddingBottom: Math.max(i.bottom, 20) + 12 }]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="ce" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={col} stopOpacity={all ? 0.35 : 0.45} />
            <Stop offset="1" stopColor={col} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="50%" cy="46%" rx="70%" ry="30%" fill="url(#ce)" />
      </Svg>
      <View style={{ paddingHorizontal: g, gap: 10 }}>
        <Rise delay={100}>
          <T style={[st.kicker, all && { color: c.onNavy2 }]}>{all ? "Level 1 complete" : `Module ${module} complete`}</T>
        </Rise>
        <Rise delay={160}>
          <T v="display" style={all && { color: c.white }}>
            {all ? "Leon can change colour." : `Leon found ${name}.`}
          </T>
        </Rise>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Leon ref={leon} look={{ skin }} mood="proud" size={Math.min(300, 280)} ground={false} />
      </View>
      <Rise delay={900} style={{ paddingHorizontal: g, gap: 18 }}>
        <T style={[st.body, all && { color: c.onNavy2 }]}>
          {all
            ? "He can read the room now. The fog over the Listening Jungle is lifting. Level 2 opens after your next ILN workshop."
            : `It's his to keep, and he's wearing it now. ${module === 1 ? "Next stop: the river." : "Next stop: the Lookout."} You can change his look in your profile.`}
        </T>
        <Button label="Continue" kind={all ? "light" : "primary"} onPress={onDone} />
      </Rise>
    </Rise>
  );
}

const st = StyleSheet.create({
  full: { zIndex: 50 },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: g, gap: 14 },
  kicker: { fontFamily: f.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.4, color: c.ink2 },
  huge: { fontFamily: f.semibold, letterSpacing: -2, color: c.navy },
  sub: { fontFamily: f.medium, fontSize: 15, lineHeight: 22, color: c.navy },
  mark: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginVertical: 8 },
  skip: { position: "absolute", bottom: 40, alignSelf: "center", fontSize: 12, color: c.ink2 },
  body: { fontSize: 16, lineHeight: 24, color: c.ink },
});
