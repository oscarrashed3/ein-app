import { useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Path, Pattern, Rect, LinearGradient, RadialGradient, Stop, Ellipse } from "react-native-svg";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { c, ease } from "../theme";
import { defaultLook, useLookMaybe, type Look } from "../state/progress";
import { BODY, FIN_GOLD, FIN_MINT, FIN_PURPLE, LEGS_BACK, LEGS_FRONT } from "./leonShapes";

/**
 * Leon, ILN's chameleon. His body, legs and crest are traced from Oscar's ChatGPT pose sheet
 * (idle pose), so he matches that design: spiral tail, one big eye, a crest in the three logo colours.
 *
 * One live vector drawing, rigged like a 2D puppet. For 60 fps on the web, nothing inside the SVG
 * animates every frame: breathing and squash-and-stretch move a plain View (a GPU transform),
 * and SVG parts only change while an emote, a blink or a mood change is playing.
 * - idle: breathing, blinks, eye drift
 * - look: earned skin colour, crest, pattern, tail tip, accessory (the learner dresses Leon)
 * - moods: eyelid, crest, head tilt, mouth, glow
 * - emotes: nod, jump (anticipation, stretch, landing squash, tail lag), shake, wow
 * Tap him and he reacts.
 */
export type Mood = "calm" | "curious" | "reading" | "guarded" | "proud" | "sleepy";
export type Emote = "nod" | "jump" | "shake" | "wow";
export type LeonHandle = { emote: (e: Emote) => void };

type MoodSpec = { tilt: number; lid: number; crest: number; smile: number; open: number; look: [number, number]; glow: number };
const MOODS: Record<Mood, MoodSpec> = {
  calm: { tilt: 0, lid: 0, crest: 0.5, smile: 0.8, open: 0, look: [0.3, 0], glow: 0.5 },
  curious: { tilt: -8, lid: 0, crest: 1, smile: 0.1, open: 0, look: [0.5, -0.7], glow: 0.6 },
  reading: { tilt: 0, lid: 0, crest: 0.7, smile: 0.5, open: 0, look: [1, 0], glow: 0.5 },
  guarded: { tilt: 3, lid: 0.5, crest: 0.1, smile: 0, open: 0, look: [0.6, 0.2], glow: 0.4 },
  proud: { tilt: -6, lid: 0, crest: 1, smile: 1, open: 1, look: [0.4, -0.3], glow: 0.8 },
  sleepy: { tilt: 2, lid: 1, crest: 0, smile: 0.1, open: 0, look: [0, 0.4], glow: 0.3 },
};

/** Skin colours: [tail, middle, head]. Leon starts nearly colourless and earns the logo colours. */
export const SKINS: Record<Look["skin"], [string, string, string]> = {
  unaware: ["#A9BDB6", "#B7C8C1", "#C6D4CE"],
  gold: ["#D9A02C", "#E4AE36", "#F0C25A"],
  purple: ["#9A2BCC", "#AE36E4", "#C266EE"],
  mint: ["#22CF98", "#36E4AD", "#6CF0C6"],
  all: [c.mint, c.purple, c.gold],
};

const AG = Animated.createAnimatedComponent(G);
const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);
const ARect = Animated.createAnimatedComponent(Rect);
const AStop = Animated.createAnimatedComponent(Stop);
const AEllipse = Animated.createAnimatedComponent(Ellipse);

const INK = c.navy;
const mixHex = (a: string, b: string, t: number) => {
  "worklet";
  return interpolateColor(t, [0, 1], [a, b]);
};
const SPIRAL = "M88 160 C88 150 76 149 73 157 C70 167 82 172 90 167 C101 160 97 142 82 140 C64 138 52 156 58 172 C66 192 92 194 106 180";

let uid = 0;

type Props = {
  mood?: Mood;
  headColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onTap?: () => void;
  ground?: boolean;
  glow?: boolean;
  interactive?: boolean;
  /** Override the learner's saved look (the wardrobe previews with this). */
  look?: Partial<Look>;
};

export const Leon = forwardRef<LeonHandle, Props>(
  function Leon({ mood = "calm", headColor, size = 160, style, onTap, ground = true, glow = true, interactive = true, look: lookProp }, ref) {
    const id = useRef(`l${uid++}`).current;
    const m = MOODS[mood];
    const saved = useLookMaybe();
    const lk: Look = { ...defaultLook, ...(saved ?? {}), ...(lookProp ?? {}) };
    const [tailC, midC, headC] = SKINS[lk.skin];
    const reduce = useReducedMotion();
    // Colours animate when the skin changes (the colour-unlock moment) or when a role-play reads the room.
    const hc = useSharedValue(headColor ?? headC);
    const mc = useSharedValue(midC);
    const tc = useSharedValue(tailC);
    const tilt = useSharedValue(m.tilt);
    const lid = useSharedValue(m.lid);
    const crest = useSharedValue(m.crest);
    const smile = useSharedValue(m.smile);
    const open = useSharedValue(m.open);
    const lookX = useSharedValue(m.look[0]);
    const lookY = useSharedValue(m.look[1]);
    const glowK = useSharedValue(m.glow);
    // Idle
    const breath = useSharedValue(0);
    const blink = useSharedValue(0);
    const drift = useSharedValue(0);
    // Emotes
    const jumpY = useSharedValue(0);
    const sqX = useSharedValue(1);
    const sqY = useSharedValue(1);
    const shakeX = useSharedValue(0);
    const nod = useSharedValue(0);
    const wow = useSharedValue(0);
    const tailLag = useSharedValue(0);

    useEffect(() => {
      const t = { duration: 600, easing: ease };
      // Head first, then the body, then the tail: the colour travels down Leon.
      hc.value = withTiming(headColor ?? headC, { duration: 450, easing: ease });
      mc.value = withDelay(140, withTiming(midC, { duration: 600, easing: ease }));
      tc.value = withDelay(280, withTiming(tailC, { duration: 700, easing: ease }));
      tilt.value = withSpring(m.tilt, { damping: 12, stiffness: 120 });
      lid.value = withTiming(m.lid, t);
      crest.value = withSpring(m.crest, { damping: 9, stiffness: 150 });
      smile.value = withTiming(m.smile, t);
      open.value = withSpring(m.open, { damping: 10, stiffness: 160 });
      lookX.value = withTiming(m.look[0], { duration: 240, easing: ease });
      lookY.value = withTiming(m.look[1], { duration: 240, easing: ease });
      glowK.value = withTiming(m.glow, { duration: 800 });
    }, [mood, headColor, lk.skin]);

    useEffect(() => {
      if (!reduce) breath.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
      const blinkLoop = () => {
        blink.value = withDelay(2400 + Math.random() * 2800, withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 150 }, (f) => f && runOnJS(blinkLoop)())));
      };
      blinkLoop();
      const driftLoop = () => {
        drift.value = withDelay(1200 + Math.random() * 2400, withTiming(Math.random() * 2 - 1, { duration: 500, easing: ease }, (f) => f && runOnJS(driftLoop)()));
      };
      driftLoop();
      return () => {
        cancelAnimation(breath);
        cancelAnimation(blink);
        cancelAnimation(drift);
      };
    }, []);

    const play = (e: Emote) => {
      if (e === "jump") {
        // anticipation (crouch), take-off stretch, landing squash, settle. Tail lags behind.
        sqY.value = withSequence(
          withTiming(0.84, { duration: 110, easing: Easing.out(Easing.quad) }),
          withTiming(1.12, { duration: 150, easing: Easing.out(Easing.quad) }),
          withDelay(120, withTiming(0.86, { duration: 110 })),
          withSpring(1, { damping: 7, stiffness: 240 }),
        );
        sqX.value = withSequence(
          withTiming(1.12, { duration: 110, easing: Easing.out(Easing.quad) }),
          withTiming(0.93, { duration: 150, easing: Easing.out(Easing.quad) }),
          withDelay(120, withTiming(1.1, { duration: 110 })),
          withSpring(1, { damping: 7, stiffness: 240 }),
        );
        if (!reduce) jumpY.value = withSequence(withDelay(110, withTiming(-30, { duration: 220, easing: Easing.out(Easing.cubic) })), withTiming(0, { duration: 170, easing: Easing.in(Easing.quad) }));
        tailLag.value = withSequence(withDelay(140, withTiming(1, { duration: 220, easing: ease })), withSpring(0, { damping: 6, stiffness: 120 }));
      }
      if (e === "shake") {
        shakeX.value = withSequence(withTiming(-7, { duration: 60 }), withTiming(7, { duration: 70 }), withTiming(-5, { duration: 70 }), withTiming(3, { duration: 60 }), withTiming(0, { duration: 80 }));
        nod.value = withSequence(withTiming(-0.6, { duration: 60 }), withTiming(0.6, { duration: 70 }), withTiming(-0.4, { duration: 70 }), withTiming(0, { duration: 80 }));
      }
      if (e === "nod") {
        nod.value = withSequence(withTiming(1, { duration: 150, easing: ease }), withTiming(0, { duration: 180, easing: ease }), withTiming(0.7, { duration: 140, easing: ease }), withTiming(0, { duration: 220, easing: ease }));
        sqY.value = withSequence(withTiming(0.97, { duration: 150, easing: ease }), withSpring(1, { damping: 9, stiffness: 200 }));
      }
      if (e === "wow") {
        wow.value = withSequence(withSpring(1, { damping: 7, stiffness: 320 }), withDelay(600, withTiming(0, { duration: 320, easing: ease })));
        sqY.value = withSequence(withTiming(1.06, { duration: 120, easing: ease }), withSpring(1, { damping: 8, stiffness: 220 }));
        sqX.value = withSequence(withTiming(0.96, { duration: 120, easing: ease }), withSpring(1, { damping: 8, stiffness: 220 }));
      }
    };
    useImperativeHandle(ref, () => ({ emote: play }), []);
    const tapN = useRef(0);
    const onPress = () => {
      const seq: Emote[] = ["nod", "jump", "wow", "shake"];
      play(seq[tapN.current++ % seq.length]);
      onTap?.();
    };

    // --- animated props ---
    // Body squash and stretch, anchored at the feet, on a View: the browser moves it on the GPU.
    const whole = useAnimatedStyle(() => ({
      transform: [
        { translateY: jumpY.value },
        { translateX: shakeX.value },
        { scaleX: sqX.value * (1 - breath.value * 0.01) },
        { scaleY: sqY.value * (1 + breath.value * 0.025) },
      ],
    }));
    // The spiral curls a little when he lands.
    const tailG = useAnimatedProps(() => ({ rotation: tailLag.value * 28, originX: 84, originY: 158 }));
    const tipInk = lk.tip === "white" ? "#FFFFFF" : lk.tip === "gold" ? c.gold : null;
    const spiralProps = useAnimatedProps(() => ({ stroke: tipInk ?? mixHex(tc.value, INK, 0.3) }));
    const stopTail = useAnimatedProps(() => ({ stopColor: tc.value }));
    const stopMid = useAnimatedProps(() => ({ stopColor: mc.value }));
    const stopHead = useAnimatedProps(() => ({ stopColor: hc.value }));
    const glowStop = useAnimatedProps(() => ({ stopColor: hc.value, stopOpacity: glowK.value * 0.7 }));
    const glowStop2 = useAnimatedProps(() => ({ stopColor: hc.value }));
    const glowEl = useAnimatedProps(() => ({ rx: 205 + wow.value * 20, ry: 125 + wow.value * 14 }));
    const faceG = useAnimatedProps(() => ({ rotation: (tilt.value + nod.value * 9) * 0.6, originX: 282, originY: 132 }));
    // Crest: each fin grows from its base with his mood.
    const finScale = (bx: number, by: number) =>
      useAnimatedProps(() => {
        const k = Math.min(1.4, crest.value + wow.value * 0.7);
        return { scale: 0.8 + k * 0.4, originX: bx, originY: by };
      });
    const BASES: [number, number][] = [[174, 96], [214, 78], [262, 84]];
    const f0 = finScale(...BASES[0]), f1 = finScale(...BASES[1]), f2 = finScale(...BASES[2]);
    const finD = (i: number) => {
      const [bx, by] = BASES[i];
      if (lk.crest === "round") {
        const w = [30, 34, 36][i], h = [26, 32, 34][i];
        return `M${bx - w / 2} ${by + 8} C${bx - w / 2} ${by - h} ${bx + w / 2} ${by - h} ${bx + w / 2} ${by + 8}Z`;
      }
      if (lk.crest === "spikes") {
        const h = [40, 50, 54][i];
        return `M${bx - 8} ${by + 8} L${bx + 3} ${by - h} L${bx + 9} ${by + 8}Z`;
      }
      return [FIN_GOLD, FIN_PURPLE, FIN_MINT][i];
    };
    const finT = lk.crest === "fins" ? ["translate(3 7)", "translate(2 6)", "translate(0 3)"] : ["", "", ""];
    const mouthProps = useAnimatedProps(() => {
      const s = smile.value, o = Math.max(open.value, wow.value);
      return { d: `M${290 - s * 3} ${153 - s} Q${303} ${154 + s * 9 + o * 6} ${316 + s * 3} ${151 - s * 2}` };
    });
    const mouthOpen = useAnimatedProps(() => {
      const o = Math.max(open.value, wow.value);
      return { d: `M288 151 Q303 ${153 + o * 26} 318 149 Q303 ${153 + o * 5} 288 151Z`, opacity: o > 0.05 ? 1 : 0 };
    });
    const tongue = useAnimatedProps(() => {
      const o = Math.max(open.value, wow.value);
      return { cx: 304, cy: 153 + o * 15, rx: o * 7, ry: o * 4, opacity: o > 0.3 ? 1 : 0 };
    });
    const look = () => {
      "worklet";
      return [lookX.value + drift.value * 0.25, lookY.value] as const;
    };
    const pupil = useAnimatedProps(() => {
      const [lx, ly] = look();
      return { cx: 278 + lx * 8, cy: 119 + ly * 8, r: 12.5 - wow.value * 3.5 };
    });
    const glint = useAnimatedProps(() => {
      const [lx, ly] = look();
      return { cx: 274 + lx * 8, cy: 114 + ly * 8 };
    });
    const lidProps = useAnimatedProps(() => {
      const l = Math.max(lid.value, blink.value);
      return { y: 119 - 27 + l * 54 - 62, fill: hc.value };
    });
    const closedLine = useAnimatedProps(() => ({ opacity: lid.value > 0.9 ? 1 : 0 }));
    const starsG = useAnimatedProps(() => ({ opacity: Math.max(0, open.value - 0.3) / 0.7 + wow.value, scale: 0.6 + Math.max(open.value, wow.value) * 0.4, originX: 335, originY: 60 }));

    const W = size, H = (size * 258) / 430;
    const VB = "-40 0 430 258";
    const pattern =
      lk.pattern === "dots" ? (
        <Pattern id={`${id}s`} width="15" height="15" patternUnits="userSpaceOnUse">
          <Circle cx="7.5" cy="7.5" r="2.5" fill="#fff" opacity={0.3} />
        </Pattern>
      ) : lk.pattern === "scales" ? (
        <Pattern id={`${id}s`} width="18" height="13" patternUnits="userSpaceOnUse">
          <Path d="M0 13 Q9 3 18 13" stroke="#fff" strokeWidth={2} fill="none" opacity={0.3} />
        </Pattern>
      ) : (
        <Pattern id={`${id}s`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <Rect width="2.2" height="14" fill="#fff" opacity={0.2} />
        </Pattern>
      );
    const inner = (
      <View style={{ width: W, height: H }}>
        {/* Back layer: glow and ground stay still while Leon breathes and hops. */}
        {(glow || ground) && (
          <Svg width={W} height={H} viewBox={VB} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id={`${id}r`} cx="50%" cy="50%" r="50%">
                <AStop offset="0" animatedProps={glowStop} />
                <AStop offset="1" stopOpacity={0} animatedProps={glowStop2} />
              </RadialGradient>
            </Defs>
            {glow && <AEllipse cx="175" cy="148" fill={`url(#${id}r)`} animatedProps={glowEl} />}
            {ground && (
              <>
                <Path d="M-30 253 Q175 246 380 253" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
                <Path d="M358 252 C364 236 376 230 382 221 C374 238 371 247 362 254Z" fill="#0E7A5A" />
              </>
            )}
          </Svg>
        )}
        <Animated.View style={[{ width: W, height: H, transformOrigin: "50% 97%" } as any, st.layer, whole]}>
          <Svg width={W} height={H} viewBox={VB}>
            <Defs>
              <LinearGradient id={`${id}g`} x1="40" y1="0" x2="330" y2="0" gradientUnits="userSpaceOnUse">
                <AStop offset="0.12" animatedProps={stopTail} />
                <AStop offset="0.5" animatedProps={stopMid} />
                <AStop offset="0.85" animatedProps={stopHead} />
              </LinearGradient>
              {pattern}
              <ClipPath id={`${id}b`}>
                <Path d={BODY} />
              </ClipPath>
              <ClipPath id={`${id}e`}>
                <Circle cx="271" cy="119" r="27" />
              </ClipPath>
            </Defs>
            {/* Legs behind the body; the far pair a shade darker. */}
            <Path d={LEGS_BACK} fill={`url(#${id}g)`} />
            <Path d={LEGS_BACK} fill={INK} opacity={0.16} />
            <Path d={LEGS_FRONT} fill={`url(#${id}g)`} />
            {/* Crest sits behind the body so the fins grow out of his back. */}
            <AG animatedProps={f0}>
              <Path d={finD(0)} fill={c.gold} transform={finT[0]} />
            </AG>
            <AG animatedProps={f1}>
              <Path d={finD(1)} fill={c.purple} transform={finT[1]} />
            </AG>
            <AG animatedProps={f2}>
              <Path d={finD(2)} fill={lk.skin === "mint" ? "#6CF0C6" : c.mint} transform={finT[2]} />
            </AG>
            <Path d={BODY} fill={`url(#${id}g)`} />
            <Rect x="-40" y="0" width="430" height="258" fill={`url(#${id}s)`} clipPath={`url(#${id}b)`} />
            <AG animatedProps={tailG}>
              <APath d={SPIRAL} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={lk.tip === "ink" ? 0.45 : 0.85} animatedProps={spiralProps} />
            </AG>
            {lk.acc === "satchel" && (
              <G>
                <Path d="M206 84 C214 124 226 160 236 196" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
                <Rect x="212" y="160" width="44" height="34" rx="9" fill={INK} />
                <Rect x="212" y="160" width="44" height="13" rx="6" fill="#1E1D48" />
                <Rect x="230" y="168" width="9" height="9" rx="2" fill={c.gold} />
              </G>
            )}
            {lk.acc === "scarf" && (
              <G>
                <G clipPath={`url(#${id}b)`}>
                  <Path d="M216 70 C228 68 242 70 250 74 C254 118 252 164 246 210 C236 212 226 211 216 208 C224 164 224 116 216 70Z" fill={c.gold} />
                  <Path d="M218 98 C228 97 240 97 251 100 M220 126 C230 125 242 125 253 127 M220 154 C230 153 242 153 252 155 M219 182 C229 181 240 181 249 183" stroke={INK} strokeWidth={3} opacity={0.3} />
                </G>
                <Path d="M232 196 C230 212 220 226 208 234 C220 234 234 228 244 204Z" fill="#C8921F" />
              </G>
            )}
            <AG animatedProps={faceG}>
              <Circle cx="271" cy="119" r="27" fill="#fff" />
              <ACircle animatedProps={pupil} fill={INK} />
              <ACircle r="3.2" fill="#fff" animatedProps={glint} />
              <ARect x="240" width="62" height="62" animatedProps={lidProps} clipPath={`url(#${id}e)`} />
              <APath d="M252 121 Q271 133 290 121" stroke={INK} strokeWidth={3.6} fill="none" strokeLinecap="round" animatedProps={closedLine} />
              <APath animatedProps={mouthOpen} fill={INK} />
              <AEllipse animatedProps={tongue} fill={c.gold} />
              <APath animatedProps={mouthProps} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
              {lk.acc === "hat" && (
                <G transform="rotate(14 300 90)">
                  <Path d="M280 88 C280 64 290 54 302 54 C314 54 324 64 324 88Z" fill="#D9C08F" />
                  <Path d="M281 80 L323 80 L324 88 L280 88Z" fill={INK} />
                  <Path d="M262 90 C284 82 320 82 344 90 C322 97 284 97 262 90Z" fill="#C7AB76" />
                </G>
              )}
            </AG>
            <AG animatedProps={starsG}>
              <Rect x="326" y="44" width="10" height="10" fill={c.gold} transform="rotate(45 331 49)" />
              <Rect x="346" y="62" width="10" height="10" fill={c.purple} transform="rotate(45 351 67)" />
              <Rect x="364" y="42" width="10" height="10" fill={c.mint} transform="rotate(45 369 47)" />
            </AG>
          </Svg>
        </Animated.View>
      </View>
    );
    if (!interactive) return <View style={style}>{inner}</View>;
    return (
      <Pressable onPress={onPress} style={style} accessibilityRole="image" accessibilityLabel="Leon, your chameleon">
        {inner}
      </Pressable>
    );
  },
);

const st = StyleSheet.create({ layer: { position: "absolute", left: 0, top: 0, willChange: "transform" } as any });

/** Leon's colour for a 0..100 "their side" value: purple (defensive) through gold to mint (on board). */
export const moodColor = (v: number) => {
  "worklet";
  return interpolateColor(v, [0, 50, 100], [c.purple, c.gold, c.mint]);
};
export const moodColorJS = (v: number) => (v < 50 ? mixJS(c.purple, c.gold, v / 50) : mixJS(c.gold, c.mint, (v - 50) / 50));
function mixJS(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = ch(pa), [r2, g2, b2] = ch(pb);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return "#" + f(r1, r2) + f(g1, g2) + f(b1, b2);
}
