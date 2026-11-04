import { StyleSheet, View } from "react-native";
import { Press } from "./Press";
import { T } from "./T";
import { c, f, r } from "../theme";
import { Arrow } from "./Icons";

/** Pill button. `primary` is a strong navy pill; `ghost` is an outline; `light` is white. */
export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
  arrow = true,
}: {
  label: string;
  onPress?: () => void;
  kind?: "primary" | "ghost" | "light";
  disabled?: boolean;
  arrow?: boolean;
}) {
  const fg = kind === "primary" ? c.white : c.navy;
  return (
    <Press
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[s.b, kind === "primary" && s.primary, kind === "ghost" && s.ghost, kind === "light" && s.light, disabled && s.off]}
    >
      <T style={[s.t, { color: fg }]}>{label}</T>
      {arrow && (
        <View style={s.a}>
          <Arrow color={fg} />
        </View>
      )}
    </Press>
  );
}

const s = StyleSheet.create({
  b: { height: 56, paddingHorizontal: 24, borderRadius: r.pill, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primary: { backgroundColor: c.navy },
  ghost: { borderWidth: 1, borderColor: c.navy },
  light: { backgroundColor: c.white },
  off: { opacity: 0.35 },
  t: { fontFamily: f.medium, fontSize: 15, letterSpacing: -0.1 },
  a: { marginLeft: 12 },
});
