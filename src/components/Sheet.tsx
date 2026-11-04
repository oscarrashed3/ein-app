import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Rise } from "./Rise";
import { T } from "./T";
import { c, f, g } from "../theme";

/** A bottom sheet over the map: tap outside or the close button to dismiss. */
export function Sheet({ title, kicker, onClose, children }: { title: string; kicker?: string; onClose: () => void; children: React.ReactNode }) {
  const ins = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
      <Rise y={0} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, st.scrim]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      </Rise>
      <Rise y={40} style={[st.panel, { paddingBottom: Math.max(ins.bottom, 16) + 8 }]}>
        <View style={st.grab} />
        <View style={st.head}>
          <View style={{ flex: 1, gap: 2 }}>
            {kicker && <T style={st.kicker}>{kicker}</T>}
            <T style={st.title}>{title}</T>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={st.x} hitSlop={8}>
            <T style={st.xT}>×</T>
          </Pressable>
        </View>
        {children}
      </Rise>
    </View>
  );
}
const st = StyleSheet.create({
  scrim: { backgroundColor: "rgba(10,9,56,0.32)" },
  panel: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: c.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: g, paddingTop: 10, gap: 14, maxWidth: 560, alignSelf: "center", width: "100%" },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 4 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  kicker: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3, color: c.ink2 },
  title: { fontFamily: f.semibold, fontSize: 24, lineHeight: 29, letterSpacing: -0.6, color: c.navy },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.paper2, alignItems: "center", justifyContent: "center" },
  xT: { fontSize: 22, lineHeight: 24, color: c.navy },
});
