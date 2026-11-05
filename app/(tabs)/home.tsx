import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { T } from "../../src/components/T";
import { Appear } from "../../src/components/Appear";
import { Press } from "../../src/components/Press";
import { Button } from "../../src/components/Button";
import { Mark } from "../../src/components/Mark";
import { Leon, type Mood } from "../../src/components/Leon";
import { Arrow } from "../../src/components/Icons";
import { dayKey, questsOf, useProgress } from "../../src/state/progress";
import { lessons, lessonsIn, modules, type Step } from "../../src/content/level1";
import { learnings } from "../../src/content/learnings";
import { c, f, g, r } from "../../src/theme";
import { Chest, Flame, Spark } from "../../src/world/JourneyHud";

const COL = [c.gold, c.purple, c.mint];
const INK = ["#8A6410", c.purpleDeep, c.mintDeep];

function hello() {
  const h = new Date().getHours();
  return h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/**
 * Home: where the app opens. Who you are today (streak, XP), what to do next, today's quests,
 * one idea to carry into the day, and the way into your learnings.
 */
export default function Home() {
  const { s, next, streak, totalXp } = useProgress();
  const nid = next();
  const n = nid ? lessons.find((l) => l.id === nid)! : null;
  const quests = questsOf(s);
  const qDone = quests.filter((q) => q.have >= q.need).length;
  const chestOpen = (s.chests ?? []).includes(dayKey());
  const learned = lessons.filter((l) => s.done[l.id]);
  const ideas = learned.filter((l) => !l.practice);
  const stop = n ? lessonsIn(n.module).indexOf(n) + 1 : 0;
  const rp = n?.steps.find((x): x is Extract<Step, { k: "roleplay" }> => x.k === "roleplay");
  // The idea of the day: one of the lessons you've done, a different one each day.
  const day = Math.floor(Date.now() / 864e5);
  const idea = ideas.length ? ideas[day % ideas.length] : null;
  const ideaL = idea ? learnings[idea.id] : null;
  const ideaM = idea ? idea.module - 1 : 0;
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const mood: Mood = !n ? "proud" : new Date().getHours() >= 21 ? "sleepy" : "calm";

  return (
    <Screen>
      <View style={st.top}>
        <Mark width={40} />
        <View style={st.cap}>
          <View style={st.seg} accessibilityLabel={`${streak} day streak`}>
            <Flame />
            <T style={st.segN}>{streak}</T>
          </View>
          <View style={st.div} />
          <View style={st.seg} accessibilityLabel={`${totalXp} XP`}>
            <Spark />
            <T style={st.segN}>{totalXp}</T>
          </View>
        </View>
      </View>

      <Appear style={st.head}>
        <T v="small">{date}</T>
        <T v="h1">
          {hello()}, {s.name || "there"}
        </T>
      </Appear>

      {/* What to do next */}
      <Appear i={1} style={st.hero}>
        <View style={st.heroTxt}>
          <T style={st.heroK}>{n ? n.practice ? `Up next · Campfire` : `Up next · Stop ${stop}` : "Level 1 complete"}</T>
          <T style={st.heroT}>{n ? n.title : "You've walked all of Quiet Shore."}</T>
          <T style={st.heroS}>{n ? (n.practice ? `Campfire practice with ${rp?.who.name.split(" ")[0]}` : `${n.minutes} min · video, then try it`) : "Level 2 opens after your next workshop."}</T>
        </View>
        <View style={st.heroLeon} pointerEvents="none">
          <Leon mood={mood} size={128} ground={false} interactive={false} />
        </View>
        <View style={{ gap: 8 }}>
          {n && <Button kind="light" label={n.practice ? "Sit by the fire" : "Start lesson"} onPress={() => router.push(`/lesson/${n.id}`)} />}
          <Press onPress={() => router.push("/today")} style={st.mapLink} accessibilityRole="button">
            <T style={st.mapLinkT}>See it on the Journey</T>
            <Arrow color={c.white} size={14} />
          </Press>
        </View>
      </Appear>

      {/* Today's quests */}
      <Appear i={2} style={st.card}>
        <View style={st.row}>
          <Chest open={chestOpen} />
          <View style={{ flex: 1 }}>
            <T v="h3">Today's quests</T>
            <T v="small">{chestOpen ? "Chest opened. New quests tomorrow." : qDone === 3 ? "All done. Open your chest on the Journey." : `${qDone} of 3 done · resets at midnight`}</T>
          </View>
        </View>
        <View style={{ gap: 10, marginTop: 4 }}>
          {quests.map((q) => {
            const ok = q.have >= q.need;
            return (
              <View key={q.k} style={st.q}>
                <View style={[st.qMark, ok && { backgroundColor: c.mint, borderColor: c.mint }]}>{ok && <T style={st.qTick}>✓</T>}</View>
                <T style={[st.qT, ok && { color: c.ink2 }]}>{q.label}</T>
                <View style={st.qBar}>
                  <View style={[st.qFill, { width: `${(Math.min(q.have, q.need) / q.need) * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </Appear>

      {/* One idea to carry into the day */}
      {idea && ideaL && (
        <Appear i={3} style={[st.card, { borderColor: COL[ideaM] }]}>
          <T style={[st.k, { color: INK[ideaM] }]}>Idea for today · {modules[ideaM].title}</T>
          <T v="h2">{ideaL.key}</T>
          {ideaL.ask && <T style={st.ask}>Ask yourself: “{ideaL.ask}”</T>}
        </Appear>
      )}

      {/* Into the learnings */}
      <Appear i={4}>
        <Press onPress={() => router.push("/learnings")} style={st.card} accessibilityRole="button" accessibilityLabel={`Your learnings, ${learned.length} of ${lessons.length}`}>
          <View style={st.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h3">Your learnings</T>
              <T v="small">Everything you've learned, summed up clearly.</T>
            </View>
            <View style={st.go}>
              <Arrow color={c.white} size={16} />
            </View>
          </View>
          <View style={{ gap: 10, marginTop: 6 }}>
            {modules.map((m, mi) => {
              const ls = lessonsIn(m.n);
              const k = ls.filter((l) => s.done[l.id]).length;
              return (
                <View key={m.n} style={{ gap: 5 }}>
                  <View style={st.mRow}>
                    <T style={st.mT}>{m.title}</T>
                    <T v="small">
                      {k}/{ls.length}
                    </T>
                  </View>
                  <View style={st.bar}>
                    <View style={[st.fill, { width: `${(k / ls.length) * 100}%`, backgroundColor: COL[mi] }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </Press>
      </Appear>
    </Screen>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  cap: { flexDirection: "row", alignItems: "center", height: 40, borderRadius: r.pill, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, paddingHorizontal: 6 },
  seg: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 40 },
  segN: { fontFamily: f.semibold, fontSize: 14, lineHeight: 18, color: c.navy },
  div: { width: 1, height: 16, backgroundColor: c.line },
  head: { gap: 4, marginBottom: 18 },
  hero: { backgroundColor: c.navy, borderRadius: r.card + 4, padding: g, gap: 16, marginBottom: 14, overflow: "hidden" },
  heroTxt: { gap: 6, paddingRight: 96 },
  heroK: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3, color: c.gold },
  heroT: { fontFamily: f.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5, color: c.white },
  heroS: { fontSize: 13, lineHeight: 19, color: c.onNavy2 },
  heroLeon: { position: "absolute", right: -18, top: 6 },
  mapLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 40 },
  mapLinkT: { fontFamily: f.medium, fontSize: 14, lineHeight: 18, color: c.white },
  card: { backgroundColor: c.white, borderRadius: r.card, borderWidth: 1, borderColor: c.line, padding: g, gap: 8, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  q: { flexDirection: "row", alignItems: "center", gap: 10 },
  qMark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: c.line, alignItems: "center", justifyContent: "center" },
  qTick: { fontSize: 12, lineHeight: 14, color: c.navy, fontFamily: f.semibold },
  qT: { fontFamily: f.medium, fontSize: 14, lineHeight: 19, color: c.ink, flex: 1 },
  qBar: { width: 64, height: 5, borderRadius: 3, backgroundColor: c.paper2, overflow: "hidden" },
  qFill: { height: "100%", backgroundColor: c.mint, borderRadius: 3 },
  k: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  ask: { fontFamily: f.medium, fontSize: 14, lineHeight: 21, color: c.ink2 },
  go: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.navy, alignItems: "center", justifyContent: "center" },
  mRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mT: { fontFamily: f.medium, fontSize: 13, lineHeight: 18, color: c.ink },
  bar: { height: 5, borderRadius: 3, backgroundColor: c.paper2, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
});
