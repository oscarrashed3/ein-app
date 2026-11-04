import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { T } from "../components/T";
import { Press } from "../components/Press";
import { Avatar } from "../components/Avatar";
import { Rise } from "../components/Rise";
import { Leon, moodColorJS, type LeonHandle } from "../components/Leon";
import { Button } from "../components/Button";
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";
import { c, ease, f, g, r } from "../theme";
import { XP, type Step } from "../content/level1";
import type { StepProps } from "./types";

type S = Extract<Step, { k: "roleplay" }>;
type Msg = { from: "them" | "you" | "note"; text: string; d?: number };

/**
 * At the table: a short scripted conversation. Every reply moves the "their side" meter,
 * and a coaching note says why. This is where the principles get practised, not just read.
 */
export function Roleplay({ step, report, locked }: StepProps<S>) {
  const [seated, setSeated] = useState(false);
  const [turn, setTurn] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [waiting, setWaiting] = useState(false); // options hidden while they "reply"
  const [delta, setDelta] = useState<{ d: number; n: number } | null>(null);
  const meter = useRef(50);
  const mv = useSharedValue(50);
  const scroll = useRef<any>(null);
  const leon = useRef<LeonHandle>(null);
  const [leonColor, setLeonColor] = useState(moodColorJS(50));
  const [won, setWon] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const sit = () => {
    setSeated(true);
    setTyping(true);
    later(() => {
      setTyping(false);
      setMsgs([{ from: "them", text: step.turns[0].them }]);
    }, 900);
  };

  const choose = (oi: number) => {
    const o = step.turns[turn].options[oi];
    meter.current = Math.max(0, Math.min(100, meter.current + o.d));
    mv.value = withSpring(meter.current, { damping: 14, stiffness: 120 });
    setDelta({ d: o.d, n: Date.now() });
    setLeonColor(moodColorJS(meter.current));
    leon.current?.emote(o.d > 0 ? "nod" : o.d < 0 ? "shake" : "wow");
    if (Platform.OS !== "web") Haptics.impactAsync(o.d > 0 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    setWaiting(true);
    setMsgs((m) => [...m, { from: "you", text: o.text }]);
    later(() => setTyping(true), 350);
    later(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "them", text: o.reply }, { from: "note", text: o.note, d: o.d }]);
    }, 1500);
    const next = turn + 1;
    later(() => {
      if (next < step.turns.length) {
        setTyping(true);
        later(() => {
          setTyping(false);
          setMsgs((m) => [...m, { from: "them", text: step.turns[next].them }]);
          setTurn(next);
          setWaiting(false);
        }, 900);
      } else {
        const v = meter.current;
        const band = v >= 80 ? "high" : v >= 55 ? "mid" : "low";
        if (band === "high") {
          setWon(true);
          leon.current?.emote("jump");
        }
        const xp = Math.round((v / 100) * XP.roleplay);
        report({
          ok: band === "high",
          xp,
          right: band === "high" ? 1 : 0,
          total: 1,
          meter: v,
          sheet: { tone: band === "high" ? "ok" : band === "mid" ? "info" : "no", title: band === "high" ? "They're on your side." : band === "mid" ? "A deal, of sorts." : "You lost them.", body: step.outcomes[band], xp, cta: "See how you did" },
        });
      }
    }, 2600);
  };

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [msgs, typing, waiting]);

  if (!seated) return <Setup step={step} onSit={sit} />;

  const opts = step.turns[turn].options;
  return (
    <View style={s.wrap}>
      <View style={s.panel}>
        <Fire v={mv} />
        <View style={s.leon} pointerEvents="none">
          <Leon ref={leon} mood={won ? "proud" : "reading"} headColor={won ? undefined : leonColor} size={92} ground={false} glow={false} interactive={false} />
        </View>
        <View style={s.who}>
          <Avatar p={step.who} size={40} dark />
          <View style={{ flex: 1 }}>
            <T style={s.name}>{step.who.name}</T>
            <T style={s.role}>{step.who.role}</T>
          </View>
          {delta && (
            <Animated.View key={delta.n} entering={FadeInUp.duration(300).easing(ease)} exiting={FadeOut.duration(200)} style={[s.delta, { backgroundColor: delta.d > 0 ? c.mint : delta.d < 0 ? c.purple : c.onNavy2 }]}>
              <T style={[s.deltaT, { color: delta.d < 0 ? c.white : c.navy }]}>{delta.d > 0 ? `+${delta.d}` : delta.d === 0 ? "±0" : delta.d}</T>
            </Animated.View>
          )}
        </View>
        <Meter v={mv} />
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={s.thread} showsVerticalScrollIndicator={false}>
        {msgs.map((m, i) =>
          m.from === "note" ? (
            <Rise key={i} delay={150} y={0} style={s.note}>
              <View style={[s.noteMark, { backgroundColor: (m.d ?? 0) > 0 ? c.mint : (m.d ?? 0) < 0 ? c.purple : c.gold }]} />
              <T style={s.noteT}>{m.text}</T>
            </Rise>
          ) : (
            <Rise key={i} style={[s.bubble, m.from === "you" ? s.you : s.them]}>
              <T style={[s.bT, m.from === "you" && { color: c.white }]}>{m.text}</T>
            </Rise>
          ),
        )}
        {typing && <Typing />}
      </ScrollView>

      {!waiting && msgs.length > 0 && !locked && (
        <Rise key={turn} style={s.opts}>
          <T style={s.say}>You say…</T>
          {opts.map((o, i) => (
            <Press key={i} onPress={() => choose(i)} style={s.opt} accessibilityRole="button">
              <T style={s.optT}>{o.text}</T>
            </Press>
          ))}
        </Rise>
      )}
    </View>
  );
}

function Setup({ step, onSit }: { step: S; onSit: () => void }) {
  return (
    <View style={{ flex: 1, gap: 24 }}>
      <Animated.View entering={FadeInDown.duration(480).easing(ease)} style={s.setup}>
        <View style={s.chairs}>
          <View style={s.seat}>
            <View style={s.youTile}>
              <T style={s.youT}>You</T>
            </View>
          </View>
          <View style={s.table} />
          <View style={s.seat}>
            <Avatar p={step.who} size={56} dark />
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <T style={s.setName}>{step.who.name}</T>
          <T style={s.role}>{step.who.role}</T>
        </View>
        <T style={s.setT}>{step.setup}</T>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(480).delay(120).easing(ease)} style={s.goal}>
        <T v="h3">Your aim</T>
        <T style={s.goalT}>{step.goal}</T>
        <T v="small">Every reply moves how {step.who.name.split(" ")[0]} feels about you. Watch the bar.</T>
      </Animated.View>
      <View style={{ marginTop: "auto" }}>
        <Button label="Take your seat" onPress={onSit} />
      </View>
    </View>
  );
}

/** The campfire: it burns brighter as their side rises. Only opacity and scale animate. */
function Fire({ v }: { v: { value: number } }) {
  const glow = useAnimatedStyle(() => ({ opacity: 0.25 + (v.value / 100) * 0.75, transform: [{ scale: 0.75 + (v.value / 100) * 0.5 }] }));
  return (
    <>
      <Animated.View style={[s.fireGlow, glow]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="fireG" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={c.gold} stopOpacity={0.55} />
              <Stop offset="0.5" stopColor="#E8834A" stopOpacity={0.18} />
              <Stop offset="1" stopColor="#E8834A" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="url(#fireG)" />
        </Svg>
      </Animated.View>
    </>
  );
}

/** Their side: how the counterpart feels about you, from defensive to on board. */
function Meter({ v }: { v: { value: number } }) {
  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: v.value / 100 }],
    backgroundColor: interpolateColor(v.value, [0, 50, 100], [c.purple, c.gold, c.mint]),
  }));
  const knob = useAnimatedStyle(() => ({ left: `${v.value}%` }));
  return (
    <View style={{ gap: 8 }}>
      <View style={s.mTrack}>
        <Animated.View style={[s.mFill, fill]} />
        <Animated.View style={[s.knob, knob]} />
      </View>
      <View style={s.mLabels}>
        <T style={s.mL}>Defensive</T>
        <T style={[s.mL, { color: c.white }]}>Their side</T>
        <T style={s.mL}>On board</T>
      </View>
    </View>
  );
}

function Typing() {
  return (
    <Rise y={0} style={[s.bubble, s.them, s.typing]}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} i={i} />
      ))}
    </Rise>
  );
}
function Dot({ i }: { i: number }) {
  const o = useSharedValue(0.25);
  useEffect(() => {
    o.value = withDelay(i * 140, withRepeat(withSequence(withTiming(1, { duration: 320 }), withTiming(0.25, { duration: 320 })), -1));
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[s.dot, a]} />;
}

const s = StyleSheet.create({
  wrap: { flex: 1, marginHorizontal: -g },
  panel: { backgroundColor: c.navy, paddingHorizontal: g, paddingTop: 16, paddingBottom: 18, gap: 16, borderBottomLeftRadius: r.card, borderBottomRightRadius: r.card, zIndex: 2 },
  fireGlow: { position: "absolute", left: "10%", right: "10%", bottom: -70, height: 200 },
  leon: { position: "absolute", right: 10, top: 2 },
  who: { flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 100 },
  name: { fontFamily: f.semibold, fontSize: 16, lineHeight: 20, color: c.white },
  role: { fontSize: 12, lineHeight: 16, color: c.onNavy2 },
  delta: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: r.pill },
  deltaT: { fontFamily: f.semibold, fontSize: 14, lineHeight: 18 },
  mTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center" },
  mFill: { position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", borderRadius: 4, transformOrigin: "left" } as any,
  knob: { position: "absolute", width: 6, height: 18, marginLeft: -3, borderRadius: 3, backgroundColor: c.white },
  mLabels: { flexDirection: "row", justifyContent: "space-between" },
  mL: { fontFamily: f.medium, fontSize: 11, lineHeight: 14, color: c.onNavy2 },
  thread: { paddingHorizontal: g, paddingVertical: 18, gap: 10 },
  bubble: { maxWidth: "84%", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20 },
  them: { alignSelf: "flex-start", backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderBottomLeftRadius: 6 },
  you: { alignSelf: "flex-end", backgroundColor: c.navy, borderBottomRightRadius: 6 },
  bT: { fontSize: 15, lineHeight: 22, color: c.ink },
  typing: { flexDirection: "row", gap: 5, paddingVertical: 15 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.navy },
  note: { flexDirection: "row", gap: 10, paddingVertical: 2, marginBottom: 6 },
  noteMark: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  noteT: { flex: 1, fontSize: 13, lineHeight: 19, color: c.ink2, fontFamily: f.medium },
  opts: { paddingHorizontal: g, paddingTop: 12, paddingBottom: 4, gap: 6, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.paper },
  say: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.ink2, marginBottom: 2 },
  opt: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.navy, borderRadius: 22 },
  optT: { fontFamily: f.medium, fontSize: 14, lineHeight: 20, color: c.navy },
  setup: { backgroundColor: c.navy, padding: g, gap: 18, borderRadius: r.card },
  chairs: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  seat: { width: 72, alignItems: "center" },
  youTile: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.white, alignItems: "center", justifyContent: "center" },
  youT: { fontFamily: f.semibold, fontSize: 14, lineHeight: 18, color: c.navy },
  table: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.25)", marginHorizontal: 8 },
  setName: { fontFamily: f.semibold, fontSize: 22, lineHeight: 27, letterSpacing: -0.5, color: c.white },
  setT: { fontSize: 16, lineHeight: 24, color: c.white },
  goal: { gap: 8 },
  goalT: { fontFamily: f.medium, fontSize: 17, lineHeight: 25, color: c.navy },
});
