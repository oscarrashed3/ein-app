import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { T } from "../../src/components/T";
import { Appear } from "../../src/components/Appear";
import { Press } from "../../src/components/Press";
import { Draft } from "../../src/components/Draft";
import { Avatar } from "../../src/components/Avatar";
import { Button } from "../../src/components/Button";
import { Check, Lock } from "../../src/components/Icons";
import { useProgress } from "../../src/state/progress";
import { lessons, lessonsIn, level, modules, type Lesson, type Step } from "../../src/content/level1";
import { c, f, g, glass, r } from "../../src/theme";
import { ISLANDS, ZONES } from "../../src/world/world";

const COL = [c.gold, c.purple, c.mint];
const INK = ["#8A6410", c.purpleDeep, c.mintDeep];
const roleplay = (l: Lesson) => l.steps.find((x): x is Extract<Step, { k: "roleplay" }> => x.k === "roleplay");

/**
 * Lessons: the same journey as a list. Up next first, then one card per zone of Quiet Shore.
 * The zone you're in is open; the others fold away so the page stays short.
 */
export default function Lessons() {
  const { s, next, unlocked } = useProgress();
  const nid = next();
  const n = nid ? lessons.find((l) => l.id === nid)! : null;
  const done = Object.keys(s.done).length;
  const curMod = n?.module ?? 3;
  const [open, setOpen] = useState<number[]>([curMod]);
  const toggle = (m: number) => setOpen((o) => (o.includes(m) ? o.filter((x) => x !== m) : [...o, m]));

  return (
    <Screen>
      <Appear style={st.head}>
        <T v="small">Level {level.n} · Quiet Shore</T>
        <T v="h1">{level.title}</T>
        <View style={st.dots} accessibilityLabel={`${done} of ${lessons.length} lessons done`}>
          {lessons.map((l) => (
            <View key={l.id} style={[st.dot, { backgroundColor: s.done[l.id] ? COL[l.module - 1] : l.id === nid ? c.navy : c.paper2 }]} />
          ))}
        </View>
        <T v="small">
          {done} of {lessons.length} done · After the workshop “{level.workshop}”
        </T>
      </Appear>

      {n && (
        <Appear i={1} style={[st.next, glass(COL[n.module - 1])]}>
          <T style={[st.nextK, { color: INK[n.module - 1] }]}>Up next · {ZONES[n.module - 1].name}</T>
          <T v="h2">{n.title}</T>
          <T v="small">{n.practice ? `Campfire practice with ${roleplay(n)?.who.name}` : `${n.minutes} min · video, then try it`}</T>
          <View style={{ marginTop: 6 }}>
            <Button label={n.practice ? "Sit by the fire" : "Start"} onPress={() => router.push(`/lesson/${n.id}`)} />
          </View>
        </Appear>
      )}

      {modules.map((m, mi) => {
        const ls = lessonsIn(m.n);
        const k = ls.filter((l) => s.done[l.id]).length;
        const isOpen = open.includes(m.n);
        const z = ZONES[m.n - 1];
        return (
          <Appear key={m.n} i={mi + 2} style={st.zone}>
            <Press onPress={() => toggle(m.n)} style={st.zHead} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={`${z.name}, ${k} of ${ls.length} done`}>
              <View style={[st.zBadge, { backgroundColor: k === ls.length ? COL[mi] : c.paper2 }]}>
                {k === ls.length ? <Check color={mi === 1 ? c.white : c.navy} size={14} /> : <T style={st.zBadgeT}>{m.n}</T>}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T style={[st.zName, { color: INK[mi] }]}>{z.name}</T>
                <T v="h3">{m.title}</T>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <T v="small">
                  {k}/{ls.length}
                </T>
                <T style={st.chev}>{isOpen ? "−" : "+"}</T>
              </View>
            </Press>
            <View style={st.bar}>
              <View style={[st.barFill, { width: `${(k / ls.length) * 100}%`, backgroundColor: COL[mi] }]} />
            </View>
            {isOpen && (
              <View style={st.list}>
                {ls.map((l) => {
                  const isDone = !!s.done[l.id];
                  const isNext = l.id === nid;
                  const can = unlocked(l.id);
                  const rp = roleplay(l);
                  return (
                    <Press
                      key={l.id}
                      disabled={!can}
                      onPress={() => router.push(`/lesson/${l.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`${l.title}${isDone ? ", done" : can ? "" : ", locked"}`}
                      style={[st.row, isNext && st.rowNext, l.practice && st.rowFire]}
                    >
                      <View style={[st.mark, isDone && { backgroundColor: COL[mi], borderColor: COL[mi] }, isNext && { borderColor: c.navy, borderWidth: 2 }]}>
                        {isDone ? <Check color={mi === 1 ? c.white : c.navy} size={11} /> : !can ? <Lock size={10} /> : null}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <T style={[st.rT, !can && { color: c.grey }]}>{l.title}</T>
                        <T style={st.rS}>{l.practice ? "Campfire practice" : `${l.minutes} min`}</T>
                      </View>
                      {l.practice && rp && <Avatar p={rp.who} size={30} />}
                    </Press>
                  );
                })}
              </View>
            )}
          </Appear>
        );
      })}

      <Appear i={5} style={st.l2}>
        <View style={st.l2Head}>
          <View style={{ gap: 2 }}>
            <T style={[st.zName, { color: c.ink2 }]}>Level 2 · {ISLANDS[0].name}</T>
            <T v="h3">Tools and techniques</T>
          </View>
          <Lock />
        </View>
        <T v="small">Good questions, empathy and rapport, deals that stick. Opens after your Level 2 workshop.</T>
      </Appear>
      <Appear i={6} style={{ marginTop: 20 }}>
        <Draft label="Lesson content is a draft for ILN" />
      </Appear>
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { gap: 8, marginBottom: 20 },
  dots: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  next: { borderRadius: r.card, padding: g, gap: 6, marginBottom: 20, backgroundColor: c.white },
  nextK: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  zone: { backgroundColor: c.white, borderRadius: r.card, borderWidth: 1, borderColor: c.line, marginBottom: 12, overflow: "hidden" },
  zHead: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  zBadge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  zBadgeT: { fontFamily: f.semibold, fontSize: 15, lineHeight: 18, color: c.navy },
  zName: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  chev: { fontFamily: f.medium, fontSize: 20, lineHeight: 20, color: c.navy },
  bar: { height: 3, backgroundColor: c.paper2, marginHorizontal: 16, borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
  list: { padding: 8, paddingTop: 10, gap: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16 },
  rowNext: { backgroundColor: c.cream, borderWidth: 1, borderColor: c.navy },
  rowFire: { backgroundColor: "#FBF5EA" },
  mark: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: c.line, alignItems: "center", justifyContent: "center", backgroundColor: c.white },
  rT: { fontFamily: f.medium, fontSize: 15, lineHeight: 20, color: c.ink },
  rS: { fontSize: 12, lineHeight: 16, color: c.ink2 },
  l2: { borderRadius: r.card, gap: 8, padding: g, borderWidth: 1, borderColor: c.line, borderStyle: "dashed", marginTop: 8 },
  l2Head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
