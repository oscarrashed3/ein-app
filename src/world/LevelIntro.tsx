import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Rise } from "../components/Rise";
import { Leon } from "../components/Leon";
import { T } from "../components/T";
import { Button } from "../components/Button";
import { Lock } from "../components/Icons";
import { c, f, g } from "../theme";
import { LEVELS } from "../content/levels";

/**
 * The opening page of a level: what it is about, its three places and what you take away.
 * Shown once when you arrive at a level, and any time from the Lessons tab.
 * Locked levels open as a preview of what is coming.
 */
export function LevelIntro({ n, locked = false, onDone }: { n: 1 | 2 | 3 | 4; locked?: boolean; onDone: () => void }) {
  const L = LEVELS[n - 1];
  const ins = useSafeAreaInsets();
  const narrow = useWindowDimensions().width < 360;
  const ink = n === 4 ? c.purple : L.colour;
  return (
    <Rise y={0} style={[StyleSheet.absoluteFill, st.full]}>
      <ScrollView contentContainerStyle={[st.pad, { paddingTop: Math.max(ins.top, 16) + 20, paddingBottom: Math.max(ins.bottom, 16) + 24 }]}>
        <Rise delay={60}>
          <T style={st.kicker}>
            Level {n} of 4 · {L.place}
          </T>
        </Rise>
        <Rise delay={110} style={st.titleRow}>
          <T style={[st.huge, narrow && { fontSize: 36, lineHeight: 40 }]}>{L.title}</T>
          {!locked && <Leon mood="curious" size={narrow ? 70 : 96} ground={false} glow={false} interactive={false} />}
        </Rise>
        {/* The whole journey in one line: four levels, this one lit. */}
        <Rise delay={160} style={st.journey}>
          {LEVELS.map((x) => (
            <View key={x.n} style={[st.seg, { backgroundColor: x.n === n ? ink : x.n < n ? c.navy : c.paper2 }]} />
          ))}
        </Rise>
        <Rise delay={200}>
          <T style={st.about}>{L.about}</T>
        </Rise>
        <View style={st.list}>
          {L.modules.map((m, i) => (
            <Rise key={m.title} delay={260 + i * 70} style={st.row}>
              <View style={[st.badge, { backgroundColor: ink }]}>
                <T style={[st.badgeT, { color: n === 1 ? c.navy : c.white }]}>{i + 1}</T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T style={st.place}>{m.place}</T>
                <T style={st.mTitle}>{m.title}</T>
                <T style={st.line}>{m.line}</T>
              </View>
            </Rise>
          ))}
        </View>
        <Rise delay={500} style={st.outcome}>
          <T style={st.place}>By the end</T>
          <T style={st.outT}>{L.outcome}</T>
        </Rise>
        <Rise delay={560} style={{ gap: 12, marginTop: 8 }}>
          {locked && (
            <View style={st.lockRow}>
              <Lock />
              <T v="small">Opens after your Level {n} ILN workshop.</T>
            </View>
          )}
          <Button label={locked ? "Back" : n === 1 ? "Start the journey" : "Let's go"} onPress={onDone} />
        </Rise>
      </ScrollView>
    </Rise>
  );
}

const st = StyleSheet.create({
  full: { zIndex: 60, backgroundColor: c.paper },
  pad: { paddingHorizontal: g, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" },
  kicker: { fontFamily: f.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.4, color: c.ink2 },
  titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  huge: { fontFamily: f.semibold, fontSize: 44, lineHeight: 48, letterSpacing: -1.8, color: c.navy, flexShrink: 1 },
  journey: { flexDirection: "row", gap: 6 },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  about: { fontSize: 17, lineHeight: 26, color: c.ink },
  list: { gap: 10, marginTop: 4 },
  row: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 20, backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2 },
  badgeT: { fontFamily: f.semibold, fontSize: 15, lineHeight: 18 },
  place: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3, color: c.ink2 },
  mTitle: { fontFamily: f.semibold, fontSize: 17, lineHeight: 22, color: c.navy },
  line: { fontSize: 14, lineHeight: 20, color: c.ink2 },
  outcome: { gap: 4, paddingTop: 4 },
  outT: { fontFamily: f.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4, color: c.navy },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
