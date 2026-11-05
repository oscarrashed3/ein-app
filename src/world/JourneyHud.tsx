import { useState, type RefObject } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { LeonHandle } from "../components/Leon";
import { T } from "../components/T";
import { Button } from "../components/Button";
import { Mark } from "../components/Mark";
import { Press } from "../components/Press";
import type { Step } from "../content/level1";
import { CHEST_XP, bestStreakOf, dayKey, freezesOf, questsOf, useProgress } from "../state/progress";
import { Sheet } from "../components/Sheet";
import { Week } from "../components/Week";
import { c, f, g, glass } from "../theme";
import { MODULE_COLOUR, ZONES, colourHex, type MapNode } from "./world";

function hello() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/**
 * Everything that floats over the Journey, shared by the 3D world and the simple map:
 * chips (quests, streak, XP), Back to Leon, the next-lesson card, and the quests and streak sheets.
 */
export function JourneyHud({ n, vpw, away, onBack, leon }: { n: MapNode | null; vpw: number; away: boolean; onBack: () => void; leon: RefObject<LeonHandle | null> }) {
  const { s, set, totalXp, streak } = useProgress();
  const ins = useSafeAreaInsets();
  const zone = n ? ZONES[n.zone - 1] : null;
  const rp = n?.lesson.steps.find((x): x is Extract<Step, { k: "roleplay" }> => x.k === "roleplay");
  const [sheet, setSheet] = useState<"quests" | "streak" | null>(null);
  const quests = questsOf(s);
  const qDone = quests.filter((q) => q.have >= q.need).length;
  const chestOpen = (s.chests ?? []).includes(dayKey());
  const best = Math.max(bestStreakOf(s.days), streak);
  const freezes = freezesOf(best);
  return (
    <>
    {/* Top: ILN mark, streak and XP on glass, the greeting on its own line */}
    <View style={[st.top, { paddingTop: Math.max(ins.top, 12) + 6 }]} pointerEvents="box-none">
      <View style={st.topRow} pointerEvents="box-none">
        {vpw >= 380 ? (
          <View style={[st.chip, glass()]}>
            <Mark width={40} />
          </View>
        ) : (
          <View />
        )}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Press onPress={() => setSheet("quests")} accessibilityRole="button" accessibilityLabel={`Daily quests, ${qDone} of 3 done`} style={[st.chip, glass(c.purple)]}>
            <Chest open={chestOpen} />
            <T style={st.chipN}>{qDone}/3</T>
          </Press>
          <Press onPress={() => setSheet("streak")} accessibilityRole="button" accessibilityLabel={`${streak} day streak`} style={[st.chip, glass(c.mint)]}>
            <Dotty col={c.mint} />
            <T style={st.chipN}>{streak}</T>
            <T style={st.chipU}>days</T>
          </Press>
          <View style={[st.chip, glass(c.gold)]} accessibilityLabel={`${totalXp} XP`}>
            <Dotty col={c.gold} />
            <T style={st.chipN}>{totalXp}</T>
            <T style={st.chipU}>XP</T>
          </View>
        </View>
      </View>
    </View>

    {away && (
      <View style={st.find} pointerEvents="box-none">
        <Press onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Leon" style={[st.findB, glass()]}>
          <T style={st.findT}>Back to Leon</T>
        </Press>
      </View>
    )}

    {/* Bottom: the next step, one black pill */}
    <View style={[st.card, glass(zone ? colourHex[MODULE_COLOUR[zone.n]] : c.navy)]}>
      {n && zone ? (
        <>
          <View style={st.cardTop}>
            <T style={st.cardK} numberOfLines={1}>
              {hello()}, {s.name || "there"} · {zone.name}
            </T>
            <T style={[st.cardK, { flexShrink: 0 }]}>{n.lesson.minutes} min</T>
          </View>
          <T style={st.cardT}>{n.lesson.title}</T>
          {rp && <T style={st.cardS}>Sit with {rp.who.name}, {rp.who.role.toLowerCase()}.</T>}
          <Button label={n.kind === "fire" ? "Sit by the fire" : "Continue"} onPress={() => router.push(`/lesson/${n.id}`)} />
        </>
      ) : (
        <>
          <T style={st.cardK}>Level 1 complete</T>
          <T style={st.cardT}>Leon can change colour.</T>
          <T style={st.cardS}>Level 2, the Listening Jungle, opens after your next ILN workshop.</T>
          <Button label="Open your profile" onPress={() => router.push("/you")} />
        </>
      )}
    </View>

    {sheet === "quests" && (
      <Sheet kicker="Resets at midnight" title="Daily quests" onClose={() => setSheet(null)}>
        {quests.map((q) => {
          const ok = q.have >= q.need;
          return (
            <View key={q.k} style={st.qRow}>
              <View style={[st.qMark, ok && { backgroundColor: c.mint, borderColor: c.mint }]}>{ok && <T style={st.qTick}>✓</T>}</View>
              <View style={{ flex: 1, gap: 6 }}>
                <T style={st.qT}>{q.label}</T>
                <View style={st.qBar}>
                  <View style={[st.qFill, { width: `${(Math.min(q.have, q.need) / q.need) * 100}%` }]} />
                </View>
              </View>
              <T style={st.qN}>
                {Math.min(q.have, q.need)}/{q.need}
              </T>
            </View>
          );
        })}
        <View style={st.chestRow}>
          <Chest open={chestOpen} big />
          <View style={{ flex: 1, gap: 2 }}>
            <T style={st.qT}>{chestOpen ? "Chest opened today" : qDone === 3 ? "Your chest is ready" : "Finish all three to open the chest"}</T>
            <T v="small">{chestOpen ? `+${CHEST_XP} XP. New quests tomorrow.` : `Worth ${CHEST_XP} bonus XP.`}</T>
          </View>
        </View>
        {qDone === 3 && !chestOpen ? (
          <Button
            label="Open the chest"
            onPress={() => {
              const today = dayKey();
              set({ chests: [...(s.chests ?? []), today], xp: { ...s.xp, [today]: (s.xp[today] ?? 0) + CHEST_XP } });
              leon.current?.emote("wow");
            }}
          />
        ) : (
          n && <Button label={chestOpen ? "Keep going" : "Do a lesson"} onPress={() => (setSheet(null), router.push(`/lesson/${n.id}`))} />
        )}
      </Sheet>
    )}
    {sheet === "streak" && (
      <Sheet kicker={streak ? "Keep it going" : "Start one today"} title={`${streak} day streak`} onClose={() => setSheet(null)}>
        <Week days={s.days} />
        <View style={st.chestRow}>
          <Freeze />
          <View style={{ flex: 1, gap: 2 }}>
            <T style={st.qT}>
              {freezes} streak {freezes === 1 ? "freeze" : "freezes"} ready
            </T>
            <T v="small">Miss a day and a freeze keeps your streak safe. You earn another for every 7 days in a row.</T>
          </View>
        </View>
        <T v="small">Best streak: {best} days. Leon gets a scarf at 3 days, a satchel at 7 and an explorer hat at 14.</T>
      </Sheet>
    )}
    </>
  );
}

/** The daily-quest chest. */
function Chest({ open, big }: { open: boolean; big?: boolean }) {
  const k = big ? 2.2 : 1;
  return (
    <Svg width={18 * k} height={16 * k} viewBox="0 0 18 16">
      <Rect x={1} y={6} width={16} height={9} rx={2} fill={c.gold} />
      <Path d={open ? "M1 6 L3 1 L17 1 L17 6Z" : "M1 7 C1 2 17 2 17 7Z"} fill={open ? "#F5CF73" : "#C8921F"} />
      <Rect x={7.5} y={7} width={3} height={4} rx={1} fill={c.navy} />
    </Svg>
  );
}
function Freeze() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={19} fill="#DDF1FB" />
      <Path d="M20 8 V32 M9.6 14 L30.4 26 M9.6 26 L30.4 14" stroke="#5BA9D6" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** A tiny dotted mark for the chips, after Pulse's dotted charts. */
function Dotty({ col }: { col: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 2, alignItems: "flex-end" }}>
      {[4, 7, 10].map((h, i) => (
        <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: col }} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  f: { flex: 1, overflow: "hidden", userSelect: "none", touchAction: "none" } as any,
  veil: { position: "absolute", left: 0, right: 0, backgroundColor: "#F4EEF6", opacity: 0.38 },
  gate: { position: "absolute", left: 300, width: 424, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 16, gap: 2 },
  gateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  gateS: { fontFamily: f.medium, fontSize: 17, lineHeight: 22, color: c.ink2, marginTop: 2 },
  leon: { position: "absolute", left: 0, top: 0 },
  tag: { position: "absolute", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10 },
  tagK: { fontFamily: f.medium, fontSize: 15, lineHeight: 19, letterSpacing: 0.3, color: c.ink2 },
  tagT: { fontFamily: f.semibold, fontSize: 24, lineHeight: 29, letterSpacing: -0.5, color: c.navy },
  shore: { position: "absolute", left: 60, top: 1450 },
  shoreK: { fontFamily: f.medium, fontSize: 18, lineHeight: 22, color: c.navy, opacity: 0.6 },
  shoreT: { fontFamily: f.semibold, fontSize: 52, lineHeight: 56, letterSpacing: -2, color: c.navy },
  top: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: 12, gap: 8 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qMark: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: c.line, alignItems: "center", justifyContent: "center", backgroundColor: c.white },
  qTick: { fontFamily: f.semibold, fontSize: 13, lineHeight: 16, color: c.navy },
  qT: { fontFamily: f.medium, fontSize: 15, lineHeight: 20, color: c.navy },
  qN: { fontFamily: f.medium, fontSize: 13, lineHeight: 16, color: c.ink2, minWidth: 44, textAlign: "right" },
  qBar: { height: 6, borderRadius: 3, backgroundColor: c.paper2, overflow: "hidden" },
  qFill: { height: "100%", borderRadius: 3, backgroundColor: c.mint },
  chestRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 20, backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  chip: { height: 40, borderRadius: 20, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  chipN: { fontFamily: f.semibold, fontSize: 18, lineHeight: 22, letterSpacing: -0.6, color: c.navy },
  chipU: { fontFamily: f.medium, fontSize: 11, lineHeight: 14, color: c.ink2 },
  greet: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, maxWidth: "100%" },
  greetT: { fontFamily: f.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.3, color: c.navy },
  find: { position: "absolute", left: 0, right: 0, bottom: 236, alignItems: "center" },
  findB: { height: 40, borderRadius: 20, paddingHorizontal: 18, justifyContent: "center" },
  findT: { fontFamily: f.semibold, fontSize: 14, lineHeight: 18, color: c.navy },
  card: { position: "absolute", left: 12, right: 12, bottom: 12, borderRadius: 24, padding: g, gap: 10, maxWidth: 496, alignSelf: "center" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardK: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.ink2, flexShrink: 1 },
  cardT: { fontFamily: f.semibold, fontSize: 21, lineHeight: 26, letterSpacing: -0.5, color: c.navy, marginBottom: 4 },
  cardS: { fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: -6, marginBottom: 4 },
});
