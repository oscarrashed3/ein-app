import { Text, TextProps, StyleSheet, useWindowDimensions } from "react-native";
import { c, f } from "../theme";

type Variant = "display" | "h1" | "h2" | "h3" | "body" | "small" | "label";

/** All type in the app goes through here, so sizes stay on one scale. */
export function T({ v = "body", style, ...p }: TextProps & { v?: Variant }) {
  const { width } = useWindowDimensions();
  // Display and h1 are fluid so long words never break mid-word on small phones.
  const w = Math.min(width, 430);
  const fluid = v === "display" ? { fontSize: clamp(w * 0.095, 30, 44), lineHeight: clamp(w * 0.1, 33, 47) } : v === "h1" ? { fontSize: clamp(w * 0.072, 24, 30), lineHeight: clamp(w * 0.082, 28, 34) } : null;
  return <Text {...p} style={[s.base, s[v], fluid, NOBREAK, style]} />;
}
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
// Web: never split a word across lines (no "aftern / oon").
const NOBREAK = { wordBreak: "keep-all", overflowWrap: "normal", hyphens: "none" } as any;

const s = StyleSheet.create({
  base: { color: c.ink, fontFamily: f.regular },
  display: { fontFamily: f.semibold, fontSize: 44, lineHeight: 46, letterSpacing: -1.8, color: c.navy },
  h1: { fontFamily: f.semibold, fontSize: 30, lineHeight: 34, letterSpacing: -1, color: c.navy },
  h2: { fontFamily: f.semibold, fontSize: 21, lineHeight: 26, letterSpacing: -0.5, color: c.navy },
  h3: { fontFamily: f.semibold, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, color: c.navy },
  body: { fontSize: 15, lineHeight: 23, color: c.ink },
  small: { fontSize: 13, lineHeight: 19, color: c.ink2 },
  label: { fontFamily: f.medium, fontSize: 13, lineHeight: 18, color: c.ink2 },
});
