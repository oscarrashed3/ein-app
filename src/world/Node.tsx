import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { Press } from "../components/Press";
import { T } from "../components/T";
import { c, f } from "../theme";
import { MODULE_COLOUR, colourHex, type Icon, type MapNode, type Palette } from "./world";

export type NodeState = "done" | "next" | "locked";

/** Node sizes by kind. Stones are pebbles, planks are planks, camp items and campfires are round. */
export const SIZE = { stone: [62, 50], plank: [86, 30], item: [56, 56], fire: [66, 66] } as const;
/** On the painted map, nodes are round badges that sit on the stones, planks and camp drawn in the picture. */
export const COMPACT = { stone: 38, plank: 34, item: 38, fire: 42 } as const;
/** On the movable island, sizes are in world units (the map scales them). */
export const WORLDSIZE = { stone: [118, 58], plank: [136, 40], item: [80, 80], fire: [88, 88] } as const;

/** One stop on the path. Only the next one animates (a soft pulse); a finished one pops once when it lights up. */
export const NodeView = memo(function NodeView({ n, state, pal, onPress, pop, compact, world }: { n: MapNode; state: NodeState; pal: Palette; onPress: () => void; pop?: boolean; compact?: boolean; world?: boolean }) {
  const [w, h] = world ? WORLDSIZE[n.kind] : compact ? [COMPACT[n.kind], COMPACT[n.kind]] : SIZE[n.kind];
  const col = colourHex[MODULE_COLOUR[n.zone]];
  const reduce = useReducedMotion();
  const sc = useSharedValue(1);
  const halo = useSharedValue(0);
  useEffect(() => {
    if (pop) sc.value = withDelay(250, withSequence(withTiming(1.22, { duration: 160, easing: Easing.out(Easing.quad) }), withSpring(1, { damping: 9, stiffness: 220 })));
  }, [pop]);
  useEffect(() => {
    if (state === "next" && !reduce) halo.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    else halo.value = 0;
  }, [state, reduce]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const haloA = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - halo.value), transform: [{ scale: 1 + halo.value * 0.6 }] }));

  const done = state === "done";
  const next = state === "next";
  const lockedFill = world ? (n.kind === "plank" ? "#CDB08A" : n.kind === "stone" ? "#C4B9D0" : "rgba(255,255,255,0.8)") : compact ? "rgba(255,255,255,0.78)" : pal.stone;
  const fill = done ? col : next ? c.cream : lockedFill;
  const fg = done ? (n.zone === 3 ? c.navy : c.white) : next ? c.navy : world && n.kind !== "item" && n.kind !== "fire" ? "#FFFFFF" : pal.sub;
  const radius = world ? (n.kind === "plank" ? 10 : n.kind === "stone" ? 29 : w / 2) : compact ? w / 2 : n.kind === "plank" ? 10 : n.kind === "stone" ? 25 : w / 2;
  // Planks still to come are only an outline: the bridge builds itself as you go.
  const ghost = false;
  const faint = n.kind === "plank" && state === "locked";
  const label = n.kind === "fire" ? `Campfire. ${n.lesson.title}` : `${n.lesson.title}`;

  return (
    <View style={[st.wrap, { left: n.x - w / 2, top: n.y - h / 2, width: w, height: h }]} pointerEvents="box-none">
      {next && <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 2, borderColor: col }, haloA]} pointerEvents="none" />}
      {done && <View style={[st.glow, { borderRadius: radius + 10, backgroundColor: col }]} pointerEvents="none" />}
      <Animated.View style={a}>
      <Press
        onPress={onPress}
        disabled={state === "locked"}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: state === "locked" }}
        hitSlop={8}
        style={[
          { width: w, height: h, borderRadius: radius, backgroundColor: ghost ? "transparent" : fill, alignItems: "center", justifyContent: "center" },
          ghost && { borderWidth: 1.5, borderStyle: "dashed", borderColor: pal.dotOff },
          next && { borderWidth: world ? 4 : 2.5, borderColor: c.navy },
          world && { shadowColor: done ? col : c.navy, shadowOpacity: done ? 0.45 : 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
          !done && !next && { opacity: compact ? 1 : faint ? 0.45 : 0.85 },
          compact && { shadowColor: done ? col : c.navy, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
        ]}
      >
        {n.icon ? <NodeIcon icon={n.icon} color={compact && !done && !next ? c.ink2 : fg} lit={done} small={compact} big={world} /> : <T style={[st.n, compact && st.nSmall, world && st.nBig, { color: compact && !done && !next ? c.ink2 : fg }]}>{n.n}</T>}
      </Press>
      </Animated.View>
      {n.kind === "fire" && !compact && !world && (
        <View style={st.fireTag} pointerEvents="none">
          <T style={[st.fireT, { color: pal.sub }]} numberOfLines={1}>
            Campfire
          </T>
        </View>
      )}
    </View>
  );
});

function NodeIcon({ icon, color, lit, small, big }: { icon: Icon; color: string; lit: boolean; small?: boolean; big?: boolean }) {
  const s = (icon === "fire" ? 32 : 26) * (small ? 0.7 : big ? 1.6 : 1);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      {icon === "map" && <Path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" stroke={color} strokeWidth={1.8} fill="none" strokeLinejoin="round" />}
      {icon === "compass" && (
        <>
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
          <Path d="M15.5 8.5l-2 5-5 2 2-5z" fill={color} />
        </>
      )}
      {icon === "lantern" && (
        <>
          <Path d="M9 4h6M12 2v2M8 7h8l-1 11H9z" stroke={color} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
          <Rect x={7} y={18} width={10} height={3} rx={1} fill={color} />
          {lit && <Circle cx={12} cy={12.5} r={2.4} fill={c.gold} />}
        </>
      )}
      {icon === "fire" && (
        <>
          <Path d="M5 21l14-4M5 17l14 4" stroke={lit ? "#7A4B21" : color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M12 3c1 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z" fill={lit ? c.gold : "none"} stroke={lit ? c.gold : color} strokeWidth={1.6} strokeLinejoin="round" />
          {lit && <Path d="M12 9c.6 1.6 2.4 2.6 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.4.8-2 1.4-2.6.2 1 .6 1.4 1 1.4 0-1.2-.6-2.2 0-3.4z" fill="#F6E3A8" />}
        </>
      )}
    </Svg>
  );
}

const st = StyleSheet.create({
  wrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", left: -8, right: -8, top: -8, bottom: -8, opacity: 0.22 },
  n: { fontFamily: f.semibold, fontSize: 17, lineHeight: 20 },
  nSmall: { fontSize: 14, lineHeight: 17 },
  nBig: { fontSize: 28, lineHeight: 32 },
  fireTag: { position: "absolute", top: "100%", marginTop: 6, width: 120, alignItems: "center" },
  fireT: { fontFamily: f.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
});
