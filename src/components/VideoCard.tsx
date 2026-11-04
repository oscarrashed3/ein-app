import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Mark } from "./Mark";
import { T } from "./T";
import { Press } from "./Press";
import { Pause, Play } from "./Icons";
import { c, ease, f } from "../theme";

/** Placeholder length: the prototype plays a short preview instead of the full 1 to 3 minutes. */
const PREVIEW_MS = 9000;

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Stand-in for an ILN lesson video (vertical, 1 to 3 minutes). In the real app this becomes
 * a Mux stream with the same controls and captions.
 */
export function VideoCard({ minutes, captions, onEnd }: { minutes: number; captions: string[]; onEnd: () => void }) {
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0); // 0..1
  const ended = useRef(false);

  useEffect(() => {
    if (!playing) return;
    const start = Date.now() - t * PREVIEW_MS;
    const id = setInterval(() => {
      const nt = Math.min(1, (Date.now() - start) / PREVIEW_MS);
      setT(nt);
      if (nt >= 1) {
        clearInterval(id);
        setPlaying(false);
        if (!ended.current) {
          ended.current = true;
          onEnd();
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  // Slow drift on the backdrop so the frame feels alive.
  const drift = useSharedValue(0);
  useEffect(() => {
    if (playing) drift.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }), -1, true);
    else cancelAnimation(drift);
  }, [playing]);
  const bg = useAnimatedStyle(() => ({ transform: [{ scale: 1.6 + drift.value * 0.12 }, { translateX: -20 + drift.value * 28 }, { rotate: "-8deg" }] }));

  const cap = Math.min(captions.length - 1, Math.floor(t * captions.length));
  const total = minutes * 60;

  return (
    <View style={s.v}>
      <Animated.View style={[s.bg, bg]} pointerEvents="none">
        <Mark width={360} color="#17164A" />
      </Animated.View>

      <View style={s.top}>
        <View style={s.who}>
          <View style={s.face}>
            <T style={s.faceT}>ILN</T>
          </View>
          <View>
            <T style={s.whoName}>ILN faculty</T>
            <T style={s.whoRole}>Presenter to be confirmed</T>
          </View>
        </View>
        <View style={s.ph}>
          <T style={s.phT}>Placeholder video</T>
        </View>
      </View>

      <Press accessibilityRole="button" accessibilityLabel={playing ? "Pause" : "Play"} onPress={() => (t >= 1 ? (setT(0), setPlaying(true)) : setPlaying(!playing))} style={s.mid}>
        <View style={[s.play, playing && s.playOn]}>{playing ? <Pause size={16} /> : <Play size={18} />}</View>
      </Press>

      <View style={s.bottom}>
        <View style={s.capBox}>
          <Animated.View key={cap} entering={FadeIn.duration(300).easing(ease)} exiting={FadeOut.duration(150)}>
            <T style={s.cap}>{captions[cap]}</T>
          </Animated.View>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${t * 100}%` }]} />
        </View>
        <View style={s.times}>
          <T style={s.time}>{clock(t * total)}</T>
          <T style={s.time}>{clock(total)}</T>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  v: { borderRadius: 24, aspectRatio: 4 / 5, backgroundColor: c.navy, overflow: "hidden", justifyContent: "space-between", padding: 16 },
  bg: { position: "absolute", left: -40, top: 120, opacity: 1 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  who: { flexDirection: "row", gap: 10, alignItems: "center" },
  face: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.navy2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  faceT: { color: c.white, fontFamily: f.semibold, fontSize: 10, lineHeight: 12 },
  whoName: { color: c.white, fontFamily: f.medium, fontSize: 13, lineHeight: 16 },
  whoRole: { color: c.onNavy2, fontSize: 11, lineHeight: 14 },
  ph: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  phT: { color: c.onNavy2, fontFamily: f.medium, fontSize: 10, lineHeight: 12, letterSpacing: 0.8, textTransform: "uppercase" },
  mid: { alignSelf: "center" },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  playOn: { paddingLeft: 0, backgroundColor: "rgba(255,255,255,0.08)" },
  bottom: { gap: 10 },
  capBox: { minHeight: 52, justifyContent: "flex-end" },
  cap: { color: c.white, fontFamily: f.medium, fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
  track: { height: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  fill: { height: "100%", backgroundColor: c.mint },
  times: { flexDirection: "row", justifyContent: "space-between" },
  time: { color: c.onNavy2, fontSize: 11, lineHeight: 14, fontFamily: f.medium },
});
