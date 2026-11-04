import { StyleSheet, View } from "react-native";
import { T } from "./T";
import { c, f } from "../theme";
import type { Person } from "../content/level1";

const TINT = { gold: "#FBF1DA", purple: c.lilac, mint: c.mintTint } as const;
const INK = { gold: "#8A6410", purple: c.purpleDeep, mint: c.mintDeep } as const;

/** A counterpart: square tile in their tone, initials in a darker shade of it. */
export function Avatar({ p, size = 44, dark = false }: { p: Person; size?: number; dark?: boolean }) {
  return (
    <View style={[s.a, { width: size, height: size, backgroundColor: dark ? "rgba(255,255,255,0.10)" : TINT[p.tone] }]}>
      <T style={[s.t, { fontSize: size * 0.32, lineHeight: size * 0.4, color: dark ? c.white : INK[p.tone] }]}>{p.initials}</T>
      <View style={[s.dot, { backgroundColor: c[p.tone] }]} />
    </View>
  );
}
const s = StyleSheet.create({
  a: { alignItems: "center", justifyContent: "center" },
  t: { fontFamily: f.semibold, letterSpacing: -0.3 },
  dot: { position: "absolute", right: 0, bottom: 0, width: 8, height: 8 },
});
