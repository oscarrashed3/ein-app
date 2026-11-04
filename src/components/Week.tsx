import { StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { T } from "./T";
import { c, ease, f } from "../theme";
import { weekOf } from "../state/progress";

/** This week, Monday to Sunday. A mint block for each day with a lesson. */
export function Week({ days, dark = false }: { days: string[]; dark?: boolean }) {
  const w = weekOf(days);
  return (
    <View style={s.row}>
      {w.map((d, i) => (
        <View key={i} style={s.col}>
          <View style={[s.cell, { backgroundColor: dark ? "rgba(255,255,255,0.10)" : c.paper2 }, d.today && !d.on && { borderWidth: 1, borderColor: dark ? c.onNavy2 : c.navy, borderStyle: "dashed" }]}>
            {d.on && <Animated.View entering={ZoomIn.duration(360).delay(120 + i * 50).easing(ease)} style={s.fill} />}
          </View>
          <T style={[s.l, { color: dark ? c.onNavy2 : c.ink2 }, d.today && { color: dark ? c.white : c.navy, fontFamily: f.semibold }]}>{d.l}</T>
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  col: { flex: 1, alignItems: "center", gap: 6 },
  cell: { borderRadius: 8, alignSelf: "stretch", height: 28 },
  fill: { borderRadius: 8, flex: 1, backgroundColor: c.mint },
  l: { fontSize: 11, lineHeight: 14, fontFamily: f.medium },
});
