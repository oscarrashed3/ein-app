import { StyleSheet, View } from "react-native";
import { T } from "./T";
import { c, f } from "../theme";

/** Small tag on anything ILN still has to approve. */
export function Draft({ label = "Draft for ILN" }: { label?: string }) {
  return (
    <View style={s.p}>
      <View style={s.d} />
      <T style={s.t}>{label}</T>
    </View>
  );
}
const s = StyleSheet.create({
  p: { borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: c.line, backgroundColor: c.white },
  d: { width: 6, height: 6, backgroundColor: c.gold },
  t: { fontFamily: f.medium, fontSize: 10, lineHeight: 14, letterSpacing: 0.8, textTransform: "uppercase", color: c.ink2 },
});
