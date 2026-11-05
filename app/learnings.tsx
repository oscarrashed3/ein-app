import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../src/components/Screen";
import { T } from "../src/components/T";
import { Appear } from "../src/components/Appear";
import { Press } from "../src/components/Press";
import { Draft } from "../src/components/Draft";
import { Back, Check, Lock } from "../src/components/Icons";
import { useProgress } from "../src/state/progress";
import { lessons, lessonsIn, level, modules } from "../src/content/level1";
import { cheat, learnings } from "../src/content/learnings";
import { c, f, g, r } from "../src/theme";

const COL = [c.gold, c.purple, c.mint];
const INK = ["#8A6410", c.purpleDeep, c.mintDeep];
const TINT = ["#FCF5E4", c.lilac, c.mintTint];

/**
 * Your learnings: everything Level 1 has taught you, in a few lines per lesson.
 * "At a glance" is the whole level on one page; "By lesson" is the key idea, three points and a question to ask yourself.
 */
export default function Learnings() {
  const { s } = useProgress();
  const [tab, setTab] = useState<"glance" | "lesson">("glance");
  const learned = lessons.filter((l) => s.done[l.id]).length;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  return (
    <Screen>
      <View style={st.top}>
        <Press onPress={close} style={st.back} accessibilityRole="button" accessibilityLabel="Back">
          <Back />
        </Press>
      </View>
      <Appear style={st.head}>
        <T v="small">Level {level.n} · {level.title}</T>
        <T v="h1">Your learnings</T>
        <T v="small">
          {learned} of {lessons.length} learned. Everything here stays, so you can come back before any real conversation.
        </T>
      </Appear>

      <Appear i={1} style={st.seg}>
        {(["glance", "lesson"] as const).map((k) => (
          <Press key={k} onPress={() => setTab(k)} style={[st.segB, tab === k && st.segOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
            <T style={[st.segT, tab === k && { color: c.white }]}>{k === "glance" ? "At a glance" : "By lesson"}</T>
          </Press>
        ))}
      </Appear>

      {tab === "glance" &&
        cheat.map((m, mi) => {
          const ls = lessonsIn(m.module).filter((l) => !l.practice);
          // Principles map one to one onto lessons; timeline and preparation steps are taught a few per lesson.
          const k = ls.filter((l) => s.done[l.id]).length;
          const shown = Math.round((k / ls.length) * m.items.length);
          return (
            <Appear key={m.module} i={mi + 2} style={st.card}>
              <View style={st.cHead}>
                <View style={[st.dot, { backgroundColor: COL[mi] }]} />
                <T style={[st.kick, { color: INK[mi] }]}>Module {m.module}</T>
              </View>
              <T v="h2">{m.title}</T>
              <View style={st.items}>
                {m.items.map((it, i) => {
                  const on = i < shown;
                  return (
                    <View key={it} style={st.item}>
                      <View style={[st.num, on ? { backgroundColor: COL[mi] } : st.numOff]}>
                        <T style={[st.numT, on && mi === 1 && { color: c.white }, !on && { color: c.grey }]}>{i + 1}</T>
                      </View>
                      <T style={[st.itT, !on && { color: c.grey }]}>{it}</T>
                    </View>
                  );
                })}
              </View>
              {shown < m.items.length && (
                <T v="small" style={{ marginTop: 2 }}>
                  The rest light up as you finish the lessons.
                </T>
              )}
            </Appear>
          );
        })}

      {tab === "lesson" &&
        modules.map((m, mi) => (
          <View key={m.n} style={{ gap: 10, marginBottom: 18 }}>
            <Appear i={mi + 2} style={st.mHead}>
              <View style={[st.dot, { backgroundColor: COL[mi] }]} />
              <T style={[st.kick, { color: INK[mi] }]}>{m.title}</T>
            </Appear>
            {lessonsIn(m.n).map((l, li) => {
              const L = learnings[l.id];
              const done = !!s.done[l.id];
              if (!done)
                return (
                  <View key={l.id} style={st.lockRow} accessibilityLabel={`${l.title}, not learned yet`}>
                    <Lock />
                    <T style={st.lockT}>{l.title}</T>
                  </View>
                );
              return (
                <Appear key={l.id} i={mi + 2 + li * 0.3} style={st.card}>
                  <View style={st.cHead}>
                    <Check color={INK[mi]} size={13} />
                    <T style={[st.kick, { color: INK[mi] }]}>{l.practice ? "Campfire practice" : l.title}</T>
                  </View>
                  <T v="h3" style={{ fontSize: 18, lineHeight: 24 }}>
                    {L.key}
                  </T>
                  <View style={{ gap: 6, marginTop: 2 }}>
                    {L.points.map((p) => (
                      <View key={p} style={st.pt}>
                        <View style={[st.bullet, { backgroundColor: COL[mi] }]} />
                        <T style={st.ptT}>{p}</T>
                      </View>
                    ))}
                  </View>
                  {L.ask && (
                    <View style={[st.ask, { backgroundColor: TINT[mi] }]}>
                      <T style={[st.askK, { color: INK[mi] }]}>Ask yourself</T>
                      <T style={st.askT}>“{L.ask}”</T>
                    </View>
                  )}
                  <Press onPress={() => router.push(`/lesson/${l.id}`)} style={st.again} accessibilityRole="button">
                    <T style={st.againT}>{l.practice ? "Practise again" : "Watch again"}</T>
                  </Press>
                </Appear>
              );
            })}
          </View>
        ))}

      <View style={{ marginTop: 12 }}>
        <Draft label="Summaries are a draft for ILN" />
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: "row", marginBottom: 8 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
  head: { gap: 6, marginBottom: 18 },
  seg: { flexDirection: "row", backgroundColor: c.paper2, borderRadius: r.pill, padding: 4, marginBottom: 18 },
  segB: { flex: 1, height: 40, borderRadius: r.pill, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: c.navy },
  segT: { fontFamily: f.medium, fontSize: 14, lineHeight: 18, color: c.navy },
  card: { backgroundColor: c.white, borderRadius: r.card, borderWidth: 1, borderColor: c.line, padding: g, gap: 8, marginBottom: 12 },
  cHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  mHead: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  kick: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3, flexShrink: 1 },
  items: { gap: 10, marginTop: 6 },
  item: { flexDirection: "row", alignItems: "center", gap: 12 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  numOff: { borderWidth: 1.5, borderColor: c.line },
  numT: { fontFamily: f.semibold, fontSize: 12, lineHeight: 16, color: c.navy },
  itT: { fontFamily: f.medium, fontSize: 15, lineHeight: 20, color: c.ink, flex: 1 },
  pt: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  ptT: { fontSize: 14, lineHeight: 21, color: c.ink2, flex: 1 },
  ask: { borderRadius: 16, padding: 14, gap: 2, marginTop: 6 },
  askK: { fontFamily: f.medium, fontSize: 11, lineHeight: 15, letterSpacing: 0.4, textTransform: "uppercase" },
  askT: { fontFamily: f.medium, fontSize: 15, lineHeight: 21, color: c.navy },
  again: { alignSelf: "flex-start", marginTop: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: r.pill, borderWidth: 1, borderColor: c.line },
  againT: { fontFamily: f.medium, fontSize: 13, lineHeight: 17, color: c.navy },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: c.line, borderStyle: "dashed" },
  lockT: { fontFamily: f.medium, fontSize: 14, lineHeight: 19, color: c.grey, flex: 1 },
});
