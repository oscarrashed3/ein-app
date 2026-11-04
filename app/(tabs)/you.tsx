import { useEffect, useRef, useState } from "react";
import { Button } from "../../src/components/Button";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Screen } from "../../src/components/Screen";
import { T } from "../../src/components/T";
import { Appear } from "../../src/components/Appear";
import { Press } from "../../src/components/Press";
import { Leon, SKINS, type LeonHandle } from "../../src/components/Leon";
import { Lock } from "../../src/components/Icons";
import { ACC_AT, bestStreakOf, useProgress, type Look, type State } from "../../src/state/progress";
import { lessons } from "../../src/content/level1";
import { c, f, g, glass, r } from "../../src/theme";

const REM: Record<State["reminder"], string> = { morning: "Morning, 8:00", lunch: "Lunch, 12:30", evening: "Evening, 18:00" };
const ORDER: State["reminder"][] = ["morning", "lunch", "evening"];
const TODS: State["tod"][] = ["auto", "dawn", "day", "dusk", "night"];

const SKIN_OPTS: { k: Look["skin"]; name: string; need?: number; hint: string }[] = [
  { k: "unaware", name: "Unaware", hint: "Where everyone starts" },
  { k: "gold", name: "Gold", need: 1, hint: "Finish the Seven Stones" },
  { k: "purple", name: "Purple", need: 2, hint: "Cross the river" },
  { k: "mint", name: "Mint", need: 3, hint: "Reach the Lookout" },
  { k: "all", name: "All three", need: 4, hint: "Finish Level 1" },
];

/** Profile: your numbers, your Leon (dress him: colours are earned with modules, accessories with your streak), settings. */
export default function Profile() {
  const [dress, setDress] = useState(false);
  const { s, set, demo, reset, earned, streak } = useProgress();
  const { width } = useWindowDimensions();
  const best = Math.max(bestStreakOf(s.days), streak);
  const leon = useRef<LeonHandle>(null);
  const look = s.look;
  const put = (p: Partial<Look>) => {
    set({ look: { ...look, ...p } });
    leon.current?.emote("wow");
  };
  const hasSkin = (need?: number) => s.unlockAll || !need || (need === 4 ? earned.length === 3 : earned.includes(need));
  const hasAcc = (a: Look["acc"]) => s.unlockAll || best >= ACC_AT[a];
  const done = Object.values(s.done);
  const right = done.reduce((a, d) => a + d.right, 0);
  const total = done.reduce((a, d) => a + d.total, 0);
  const stage = Math.min(width - g * 2 - 32, 400);
  const skinCol = SKINS[look.skin][1];
  // Weekly XP, against a sample workshop group (prototype data).
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const myWeek = Object.entries(s.xp).filter(([d]) => new Date(d + "T12:00:00") >= weekAgo).reduce((a, [, v]) => a + v, 0);
  const group = [
    { name: "Amira", xp: 210 },
    { name: "Jonas", xp: 165 },
    { name: "Chloé", xp: 120 },
    { name: "Ravi", xp: 75 },
    { name: "Mei", xp: 40 },
    { name: s.name || "You", xp: myWeek, you: true },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <Screen>
      <Appear style={st.prof}>
        <View style={st.avatar}>
          <T style={st.avT}>{(s.name || "?").slice(0, 1).toUpperCase()}</T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="h1">{s.name || "You"}</T>
          <T v="small">Level 1 · Foundations · Quiet Shore</T>
        </View>
      </Appear>

      <Appear i={1} style={st.sec}>
        <SecHead t="Your numbers" />
        <View style={st.stats}>
          <Stat n={streak} u="day streak" />
          <Stat n={best} u="best streak" />
          <Stat n={done.length} u={`of ${lessons.length} lessons`} />
          <Stat n={total ? Math.round((right / total) * 100) : "–"} u="% checks right" />
        </View>
      </Appear>

      <Appear i={2} style={st.leonCard}>
        <View style={st.secHead}>
          <T v="h3">Your Leon</T>
          <T v="small">{earned.length} of 3 colours earned</T>
        </View>
      <View style={[st.stage, { height: stage * 0.62 }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="stg" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={skinCol} stopOpacity={0.45} />
              <Stop offset="1" stopColor={skinCol} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50%" cy="48%" rx="58%" ry="44%" fill="url(#stg)" />
          <Ellipse cx="50%" cy="86%" rx="34%" ry="5%" fill={c.navy} opacity={0.08} />
        </Svg>
        <Turntable>
          <Leon ref={leon} mood="proud" size={Math.min(stage * 0.78, 320)} ground={false} glow={false} />
        </Turntable>
        <T style={st.tap}>Tap him</T>
      </View>
        <T v="small">
          {earned.length === 0
            ? "He can't change colour yet. Every module you finish gives him one of ILN's colours."
            : earned.length < 3
              ? `He has earned ${earned.length} of ILN's three colours. The rest come with the next modules.`
              : "He can change colour now. Dress him however you like."}
        </T>
        <Button label={dress ? "Done" : "Customise Leon"} kind={dress ? "primary" : "ghost"} onPress={() => setDress(!dress)} />
      </Appear>
      {dress && (
        <>
      <Appear i={0} style={st.sec}>
        <SecHead t="Colour" s={`${earned.length} of 3 earned`} />
        <View style={st.swatches}>
          {SKIN_OPTS.map((o) => {
            const open = hasSkin(o.need);
            const on = look.skin === o.k;
            const [t, m, h] = SKINS[o.k];
            return (
              <Press key={o.k} disabled={!open} onPress={() => put({ skin: o.k })} style={[st.sw, on && st.swOn]} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !open }} accessibilityLabel={`${o.name}${open ? "" : `, locked. ${o.hint}`}`}>
                <View style={[st.swDot, { backgroundColor: m, opacity: open ? 1 : 0.35 }]}>
                  <View style={[st.swHalf, { backgroundColor: h }]} />
                  <View style={[st.swTail, { backgroundColor: t }]} />
                  {!open && (
                    <View style={st.swLock}>
                      <Lock color={c.navy} size={14} />
                    </View>
                  )}
                </View>
                <T style={[st.swT, on && { color: c.navy, fontFamily: f.semibold }]} numberOfLines={1}>
                  {o.name}
                </T>
              </Press>
            );
          })}
        </View>
        {(() => {
          const nextLocked = SKIN_OPTS.find((o) => !hasSkin(o.need));
          return nextLocked ? <T v="small">Next colour: {nextLocked.name.toLowerCase()}. {nextLocked.hint}.</T> : null;
        })()}
      </Appear>

      <Appear i={1} style={st.sec}>
        <SecHead t="Crest" />
        <Pills value={look.crest} opts={[["fins", "Fins"], ["round", "Round"], ["spikes", "Spikes"]]} onPick={(v) => put({ crest: v as Look["crest"] })} />
        <SecHead t="Skin pattern" />
        <Pills value={look.pattern} opts={[["hatch", "Hatch"], ["dots", "Dots"], ["scales", "Scales"]]} onPick={(v) => put({ pattern: v as Look["pattern"] })} />
        <SecHead t="Tail tip" />
        <Pills value={look.tip} opts={[["ink", "Ink"], ["white", "White"], ["gold", "Gold"]]} onPick={(v) => put({ tip: v as Look["tip"] })} />
      </Appear>

      <Appear i={2} style={st.sec}>
        <SecHead t="Accessory" s="Earned with your streak" />
        <Pills
          value={look.acc}
          opts={(["none", "scarf", "satchel", "hat"] as Look["acc"][]).map((a) => [a, a === "none" ? "None" : a === "hat" ? "Explorer hat" : a[0].toUpperCase() + a.slice(1), hasAcc(a) ? undefined : `${ACC_AT[a]}-day streak`])}
          onPick={(v) => put({ acc: v as Look["acc"] })}
        />
      </Appear>
        </>
      )}

      <Appear i={4} style={st.sec}>
        <SecHead t="Your workshop group" s="This week · resets Monday" />
        <View style={st.board}>
          {group.map((p, i) => (
            <View key={p.name} style={[st.bRow, p.you && st.bYou]}>
              <T style={[st.bRank, i < 3 && { color: [c.gold, c.purple, c.mintDeep][i] }]}>{i + 1}</T>
              <View style={[st.bAv, { backgroundColor: p.you ? c.navy : c.paper2 }]}>
                <T style={[st.bAvT, p.you && { color: c.white }]}>{p.name.slice(0, 1)}</T>
              </View>
              <T style={[st.bName, p.you && { fontFamily: f.semibold }]} numberOfLines={1}>
                {p.you ? `${p.name} (you)` : p.name}
              </T>
              <T style={st.bXp}>{p.xp} XP</T>
            </View>
          ))}
        </View>
        <T v="small">Everyone from your workshop, cheering each other on. No one drops out. Sample names for the prototype.</T>
      </Appear>

      <Appear i={5} style={st.sec}>
        <SecHead t="Your field journal" s={`${done.length} of ${lessons.length} collected`} />
        <View style={st.journal}>
          {lessons.map((l, i) => {
            const got = !!s.done[l.id];
            const col = [c.gold, c.purple, c.mint][l.module - 1];
            return (
              <View key={l.id} style={[st.jCard, got ? { backgroundColor: col + "22", borderColor: col } : st.jLocked]} accessibilityLabel={`${l.title}${got ? "" : ", not collected yet"}`}>
                <T style={[st.jN, got && { color: c.navy }]}>{i + 1}</T>
                <T style={[st.jT, !got && { color: c.grey }]} numberOfLines={3}>
                  {got ? l.title : l.practice ? "Campfire" : "?"}
                </T>
              </View>
            );
          })}
        </View>
        <T v="small">Every lesson you finish adds its idea to your journal, so you can look back before a big conversation.</T>
      </Appear>

      <Appear i={6} style={st.sec}>
        <SecHead t="Settings" />
        <Press style={st.row} onPress={() => set({ reminder: ORDER[(ORDER.indexOf(s.reminder) + 1) % 3] })} accessibilityRole="button">
          <T style={st.rowT}>Daily nudge</T>
          <T v="small">{REM[s.reminder]}</T>
        </Press>
        <View style={st.row}>
          <T style={st.rowT}>Shared with your manager</T>
          <T v="small">Completion only</T>
        </View>
      </Appear>

      <Appear i={7} style={[st.sec, st.demo]}>
        <View style={st.demoHead}>
          <View style={st.demoDot} />
          <T v="label">Prototype only</T>
        </View>
        <Row t="Fill with demo progress" s="5 lessons, Leon hops to stone 6" onPress={() => (demo(5), router.navigate("/today"))} />
        <Row t="Finish the Seven Stones" s="See Leon earn gold" onPress={() => (demo(8), router.navigate("/today"))} />
        <Row t="Almost done with Level 1" s="One campfire left" onPress={() => (demo(17), router.navigate("/today"))} />
        <Row t={s.unlockAll ? "Wardrobe: all unlocked" : "Unlock the whole wardrobe"} s={s.unlockAll ? "Tap to lock again" : "Try every colour"} onPress={() => set({ unlockAll: !s.unlockAll })} />
        <Row t="Map time of day" s={s.tod === "auto" ? "Follows your clock" : s.tod[0].toUpperCase() + s.tod.slice(1)} onPress={() => set({ tod: TODS[(TODS.indexOf(s.tod) + 1) % TODS.length] })} />
        <Row
          t="Start over"
          s="Clears everything"
          onPress={() => {
            reset();
            router.replace("/welcome");
          }}
        />
      </Appear>
    </Screen>
  );
}

/** A slow turn every few seconds, like a figure on a turntable. Off with reduced motion. */
function Turntable({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const sx = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    const half = { duration: 260, easing: Easing.inOut(Easing.quad) };
    sx.value = withRepeat(withSequence(withDelay(4200, withTiming(-1, half)), withDelay(4200, withTiming(1, half))), -1, false);
  }, [reduce]);
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: sx.value }] }));
  return <Animated.View style={[a, { willChange: "transform" } as any]}>{children}</Animated.View>;
}

function SecHead({ t, s }: { t: string; s?: string }) {
  return (
    <View style={st.secHead}>
      <T v="h3">{t}</T>
      {s && <T v="small">{s}</T>}
    </View>
  );
}

/** Calm pills that fill with navy when chosen; locked ones say what earns them. */
function Pills({ value, opts, onPick }: { value: string; opts: [string, string, string?][]; onPick: (v: string) => void }) {
  return (
    <View style={st.pills}>
      {opts.map(([k, label, lock]) => {
        const on = value === k;
        return (
          <Press key={k} disabled={!!lock} onPress={() => onPick(k)} style={[st.pill, on && st.pillOn, !!lock && st.pillOff]} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !!lock }}>
            {!!lock && <Lock size={12} color={c.ink2} />}
            <T style={[st.pillT, on && { color: c.white }]}>{label}</T>
            {!!lock && <T style={st.pillLock}>{lock}</T>}
          </Press>
        );
      })}
    </View>
  );
}

function Stat({ n, u }: { n: number | string; u: string }) {
  return (
    <View style={st.stat}>
      <T style={st.statN}>{n}</T>
      <T v="small">{u}</T>
    </View>
  );
}

function Row({ t, s, onPress }: { t: string; s: string; onPress: () => void }) {
  return (
    <Press style={st.row} onPress={onPress} accessibilityRole="button">
      <T style={st.rowT}>{t}</T>
      <T v="small" style={{ flexShrink: 1, textAlign: "right" }}>
        {s}
      </T>
    </Press>
  );
}

const st = StyleSheet.create({
  prof: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.navy, alignItems: "center", justifyContent: "center" },
  avT: { color: c.white, fontFamily: f.semibold, fontSize: 24, lineHeight: 28 },
  leonCard: { backgroundColor: c.white, borderRadius: r.card, borderWidth: 1, borderColor: c.line, padding: 16, gap: 12, marginBottom: 28 },
  head: { gap: 6, marginBottom: 16 },
  stage: { borderRadius: 18, backgroundColor: c.cream, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: c.line },
  tap: { position: "absolute", bottom: 4, fontSize: 11, color: c.ink2 },
  sec: { gap: 12, marginBottom: 28 },
  board: { backgroundColor: c.white, borderRadius: r.card, borderWidth: 1, borderColor: c.line, padding: 6 },
  bRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 16 },
  bYou: { backgroundColor: c.cream },
  bRank: { fontFamily: f.semibold, fontSize: 15, lineHeight: 18, color: c.ink2, width: 18, textAlign: "center" },
  bAv: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bAvT: { fontFamily: f.semibold, fontSize: 14, lineHeight: 17, color: c.navy },
  bName: { flex: 1, fontFamily: f.medium, fontSize: 15, lineHeight: 20, color: c.ink },
  bXp: { fontFamily: f.medium, fontSize: 13, lineHeight: 16, color: c.ink2 },
  journal: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  jCard: { width: "31.5%", minHeight: 78, borderRadius: 16, borderWidth: 1, padding: 10, gap: 4 },
  jLocked: { borderColor: c.line, borderStyle: "dashed", backgroundColor: "transparent" },
  jN: { fontFamily: f.semibold, fontSize: 12, lineHeight: 15, color: c.grey },
  jT: { fontSize: 11.5, lineHeight: 15, color: c.navy, fontFamily: f.medium },
  secHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  swatches: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  sw: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 8, borderRadius: 18 },
  swOn: { ...glass(), backgroundColor: c.white },
  swDot: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
  swHalf: { position: "absolute", right: 0, top: 0, bottom: 0, width: 16 },
  swTail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 12 },
  swLock: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  swT: { fontFamily: f.medium, fontSize: 11, lineHeight: 14, color: c.ink2 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  pill: { minHeight: 44, paddingHorizontal: 18, borderRadius: r.pill, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, flexDirection: "row", alignItems: "center", gap: 6 },
  pillOn: { backgroundColor: c.navy, borderColor: c.navy },
  pillOff: { backgroundColor: "transparent", borderStyle: "dashed" },
  pillT: { fontFamily: f.medium, fontSize: 14, lineHeight: 18, color: c.navy },
  pillLock: { fontSize: 11, lineHeight: 14, color: c.ink2 },
  stats: { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  stat: { width: "50%", gap: 0 },
  statN: { fontFamily: f.semibold, fontSize: 44, lineHeight: 48, letterSpacing: -2, color: c.navy },
  dotBar: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  row: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: c.line },
  rowT: { fontFamily: f.medium, fontSize: 15, lineHeight: 20, color: c.ink },
  demo: { padding: g, borderWidth: 1, borderColor: c.line, borderStyle: "dashed", borderRadius: r.card, gap: 4 },
  demoHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.gold },
});
