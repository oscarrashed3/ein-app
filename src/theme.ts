import { Easing } from "react-native-reanimated";

/** ILN tokens. Cool white ground and navy carry the app (ILN's own colours); gold, purple and mint are Leon's earned colours. */
export const c = {
  paper: "#F3F4F9",
  paper2: "#E6E8F1",
  line: "#DDE0EB",
  cream: "#FFFFFF",
  glass: "rgba(255,255,255,0.72)",
  glassLine: "rgba(255,255,255,0.85)",
  mist: "#D2D8E8",
  white: "#FFFFFF",
  ink: "#141518",
  ink2: "#575A73",
  grey: "#8C8EA5",
  navy: "#0A0938",
  navy2: "#1E1D48",
  onNavy2: "#B4B3CC",
  gold: "#E4AE36",
  purple: "#AE36E4",
  mint: "#36E4AD",
  mintDeep: "#0E7A5A",
  mintTint: "#E7FCF5",
  lilac: "#F8EFFD",
  purpleDeep: "#7A1FA3",
} as const;

export const f = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
} as const;

/** One gutter for everything, so every screen sits on the same grid. */
export const g = 20;

export const ease = Easing.bezier(0.23, 1, 0.32, 1);

/** Rounded, soft system (v5): cards and pills. */
export const r = { card: 24, pill: 999, chip: 14 };
/** Soft coloured shadow, never grey. */
export const lift = (tint: string = "#0A0938", k = 1) => ({
  shadowColor: tint,
  shadowOpacity: 0.12 * k,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
});

/** Frosted glass: white at 72%, 24 px blur (web), a fine white edge, a soft tinted shadow. */
export const glass = (tint: string = "#0A0938") =>
  ({
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    ...lift(tint, 0.9),
  }) as any;
