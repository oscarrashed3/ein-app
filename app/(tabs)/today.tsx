import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Platform, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withDecay, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Leon, type LeonHandle, type Mood } from "../../src/components/Leon";
import { T } from "../../src/components/T";
import { Button } from "../../src/components/Button";
import { Mark } from "../../src/components/Mark";
import { Press } from "../../src/components/Press";
import { lessons, type Step } from "../../src/content/level1";
import { useProgress, type Skin } from "../../src/state/progress";
import { c, ease, f, g, glass } from "../../src/theme";
import { Dots } from "../../src/world/Backdrop";
import { Island, WORLD } from "../../src/world/Island";
import { NodeView, WORLDSIZE, type NodeState } from "../../src/world/Node";
import { ColourEarned, ZoneArrival } from "../../src/world/Moments";
import { ISLANDS, MODULE_COLOUR, PALETTES, ZONES, colourHex, layoutIsland, todNow } from "../../src/world/world";

const LEON = 150; // Leon's width in world units
const LEON_H = (LEON * 150) / 250;
const CROP = 600; // world units across the phone: the strip around the path, so the map is never too spread out
const EXTRA = 210; // scroll room under the beach so the first stones clear the bottom card

function hello() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

type Moment = { k: "zone"; zone: 1 | 2 | 3 } | { k: "colour"; module: number; from: Skin; to: Skin };

/**
 * Journey: Quiet Shore as a world you can move around in. Drag to explore, pinch or scroll to zoom,
 * zoom out to see the whole island. Leon stands where you are and hops on after each lesson.
 */
export default function Journey() {
  const { s, ready, set, next, totalXp, earned, streak } = useProgress();
  const ins = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const w = useMemo(() => layoutIsland(), []);
  const pal = PALETTES[s.tod === "auto" ? todNow() : s.tod];
  const nid = next();
  const target = nid ?? "end";
  const levelDone = !nid;

  // ---- camera ----
  // The map scrolls one way, like a long poster: it always fills the width of the phone,
  // and you drag (or scroll) up and down the path. No sideways drift, no empty edges.
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const cy = useSharedValue(0);
  const vpw = vp.w, vph = vp.h;
  const sc = vpw ? Math.max(vpw / WORLD.w, Math.min(1.25, vpw / CROP)) : 0.6;
  const cx = vpw / 2 - WORLD.w * 0.5 * sc;
  const clampY = (y: number) => {
    "worklet";
    const hi = 0, lo = vph - WORLD.h * sc - EXTRA;
    return Math.min(hi, Math.max(lo, y));
  };
  const focusY = (y: number, animated = true) => {
    const ny = clampY(vph * 0.4 - y * sc);
    cy.value = animated && !reduce ? withTiming(ny, { duration: 620, easing: ease }) : ny;
  };
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setVp({ w: width, h: height });
  };

  const y0 = useRef(0);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dy) > 6,
        onPanResponderGrant: () => {
          cancelAnimation(cy);
          y0.current = cy.value;
        },
        onPanResponderMove: (_, gs) => {
          const y = y0.current + gs.dy;
          const c0 = clampY(y);
          cy.value = c0 + (y - c0) * 0.3; // a little rubber band past the ends
        },
        onPanResponderRelease: (_, gs) => {
          const lo = vph - WORLD.h * sc - EXTRA;
          if (reduce || cy.value > 0 || cy.value < lo) {
            cy.value = withTiming(clampY(cy.value), { duration: 260, easing: ease });
            return;
          }
          cy.value = withDecay({ velocity: gs.vy * 1000, clamp: [Math.min(lo, 0), 0], deceleration: 0.995 });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [vpw, vph, reduce, sc],
  );

  // Web: the mouse wheel or a two-finger swipe moves along the path.
  const box = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const el = box.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimation(cy);
      cy.value = clampY(cy.value - e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [vpw, vph, sc]);

  const worldStyle = useAnimatedStyle(() => ({ transform: [{ translateX: cx }, { translateY: cy.value }, { scale: sc }] }));
  // "Find Leon" shows only when he is off screen.
  const [away, setAway] = useState(false);

  // ---- Leon and the hop ----
  const posOf = useCallback(
    (id: string | null) => {
      if (id === "end") return { x: w.lookout.x - 90, y: w.lookout.y + 20, top: w.lookout.y + 20 };
      const n = w.nodes.find((q) => q.id === id);
      if (!n) return null;
      return { x: n.x, y: n.y, top: n.y - WORLDSIZE[n.kind][1] / 2 + 10 };
    },
    [w],
  );
  const fx = useSharedValue(0), fy = useSharedValue(0), tx = useSharedValue(posOf(target)!.x), ty = useSharedValue(posOf(target)!.top);
  const hopT = useSharedValue(1);
  const segOn = useSharedValue(1);
  const [hopping, setHopping] = useState<{ seg: number; popId: string } | null>(null);
  const [queue, setQueue] = useState<Moment[]>([]);
  const leon = useRef<LeonHandle>(null);
  const leonStyle = useAnimatedStyle(() => {
    const t = hopT.value;
    const x = fx.value + (tx.value - fx.value) * t;
    const y = fy.value + (ty.value - fy.value) * t - Math.sin(Math.PI * t) * 70;
    return { transform: [{ translateX: (t >= 1 ? tx.value : x) - LEON * 0.56 }, { translateY: (t >= 1 ? ty.value : y) - LEON_H * 0.87 }] };
  });
  const segStyle = useAnimatedStyle(() => ({ opacity: segOn.value }));

  const sRef = useRef(s);
  sRef.current = s;
  const laidOut = vpw > 0;
  useFocusEffect(
    useCallback(() => {
      if (!ready || !laidOut) return;
      const st = sRef.current;
      const moments: Moment[] = [];
      let skin: Skin = st.look.skin;
      const seen = [...st.earnedSeen];
      for (const m of earned) {
        if (seen.includes(m)) continue;
        const toSkin: Skin = m === 3 && earned.length === 3 ? "all" : MODULE_COLOUR[m];
        moments.push({ k: "colour", module: m, from: skin, to: toSkin });
        skin = toSkin;
        seen.push(m);
      }
      const z = nid ? (lessons.find((l) => l.id === nid)!.module as 1 | 2 | 3) : null;
      const zones = [...st.zones];
      if (z && !zones.includes(z)) {
        moments.push({ k: "zone", zone: z });
        zones.push(z);
      }
      const p1 = posOf(target)!;
      const p0 = st.mapAt && st.mapAt !== target ? posOf(st.mapAt) : null;
      if (st.mapAt !== target || moments.length) set({ mapAt: target, zones, earnedSeen: seen, look: { ...st.look, skin } });

      if (p0 && !reduce) {
        // Start on the stone you just finished: it lights, the path fills, then Leon hops and the camera follows.
        const seg = nid ? lessons.findIndex((l) => l.id === nid) : lessons.length;
        fx.value = p0.x;
        fy.value = p0.top;
        tx.value = p1.x;
        ty.value = p1.top;
        hopT.value = 0;
        segOn.value = 0;
        setHopping({ seg, popId: st.mapAt! });
        focusY(p0.y, false);
        segOn.value = withDelay(500, withTiming(1, { duration: 380 }));
        const tm = setTimeout(() => {
          leon.current?.emote("jump");
          hopT.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.23, 1, 0.32, 1) }, (fin) => {
            if (fin) runOnJS(afterHop)(moments);
          });
          focusY(p1.y, true);
        }, 900);
        return () => clearTimeout(tm);
      }
      hopT.value = 1;
      tx.value = p1.x;
      ty.value = p1.top;
      focusY(p1.y, false);
      if (moments.length) setQueue(moments);
    }, [ready, target, laidOut, sc]),
  );
  const afterHop = (moments: Moment[]) => {
    setHopping(null);
    setTimeout(() => leon.current?.emote("nod"), 120);
    if (moments.length) setTimeout(() => setQueue(moments), 500);
  };

  const stateOf = (id: string): NodeState => (s.done[id] ? "done" : id === nid ? "next" : "locked");
  const n = nid ? w.nodes.find((q) => q.id === nid)! : null;
  const zone = n ? ZONES[n.zone - 1] : null;
  const rp = n?.lesson.steps.find((x): x is Extract<Step, { k: "roleplay" }> => x.k === "roleplay");
  const evening = new Date().getHours() >= 21 || new Date().getHours() < 5;
  const mood: Mood = levelDone ? "proud" : evening ? "sleepy" : "calm";
  const walked = (i: number) => (i < lessons.length ? !!s.done[lessons[i].id] || lessons[i].id === nid : levelDone);
  const colourOf = (i: number) => colourHex[MODULE_COLOUR[i < lessons.length ? lessons[i].module : 3]];
  const cur = queue[0];
  const here = posOf(target)!;
  useAnimatedReaction(
    () => {
      const yy = here.y * sc + cy.value;
      return yy < 90 || yy > vph - 200;
    },
    (v, p) => {
      if (v !== p) runOnJS(setAway)(v);
    },
    [here.y, sc, vph],
  );

  return (
    <View style={[st.f, { backgroundColor: "#8FDACB" }]}>
      <View ref={box} style={st.f} onLayout={onLayout} {...pan.panHandlers}>
        <Animated.View style={[st.world, worldStyle]}>
          <Island nodes={w.nodes} />
          {/* Time of day: the island is drawn at dawn; dusk and night are washes of light over it. */}
          {pal.tod === "dusk" && <View style={[StyleSheet.absoluteFill, { backgroundColor: "#B75E8E", opacity: 0.16 }]} pointerEvents="none" />}
          {pal.tod === "day" && <View style={[StyleSheet.absoluteFill, { backgroundColor: "#BFE6F0", opacity: 0.12 }]} pointerEvents="none" />}
          {pal.night && <View style={[StyleSheet.absoluteFill, { backgroundColor: c.navy, opacity: 0.5 }]} pointerEvents="none" />}
          {/* The path: dots ahead are faint footprints, dots behind you take the module's colour */}
          <Dots w={w as any} W={WORLD.w} H={WORLD.h} colourOf={colourOf} walked={(i) => walked(i) && i !== hopping?.seg} offColour="rgba(140,110,80,0.35)" scale={2} />
          {hopping && (
            <Animated.View style={[StyleSheet.absoluteFill, segStyle]} pointerEvents="none">
              <Dots w={w as any} W={WORLD.w} H={WORLD.h} colourOf={colourOf} walked={() => true} only={hopping.seg} offColour="transparent" scale={2} />
            </Animated.View>
          )}

          {/* Places, as glass tags on the world */}
          <View style={[st.tag, glass(), { left: 400, top: levelDone ? 150 : 250 }]} pointerEvents="none">
            <T style={st.tagK}>Level 2 · {levelDone ? "Opens after your next workshop" : "In the mist"}</T>
            <T style={st.tagT}>{ISLANDS[0].name}</T>
          </View>
          {w.nodes.map((q) => (
            <NodeView world key={q.id} n={q} state={stateOf(q.id)} pal={pal} pop={hopping?.popId === q.id} onPress={() => router.push(`/lesson/${q.id}`)} />
          ))}

          <Animated.View style={[st.leon, leonStyle]} pointerEvents="box-none">
            <Leon ref={leon} mood={mood} size={LEON} ground={false} glow={false} />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Top: ILN mark, streak and XP on glass, the greeting on its own line */}
      <View style={[st.top, { paddingTop: Math.max(ins.top, 12) + 6 }]} pointerEvents="box-none">
        <View style={st.topRow} pointerEvents="box-none">
          <View style={[st.chip, glass()]}>
            <Mark width={40} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={[st.chip, glass(c.mint)]} accessibilityLabel={`${streak} day streak`}>
              <Dotty col={c.mint} />
              <T style={st.chipN}>{streak}</T>
              <T style={st.chipU}>days</T>
            </View>
            <View style={[st.chip, glass(c.gold)]} accessibilityLabel={`${totalXp} XP`}>
              <Dotty col={c.gold} />
              <T style={st.chipN}>{totalXp}</T>
              <T style={st.chipU}>XP</T>
            </View>
          </View>
        </View>
      </View>

      {away && (
        <View style={st.find} pointerEvents="box-none">
          <Press onPress={() => focusY(here.y)} accessibilityRole="button" accessibilityLabel="Back to Leon" style={[st.findB, glass()]}>
            <T style={st.findT}>Back to Leon</T>
          </Press>
        </View>
      )}

      {/* Bottom: the next step, one black pill */}
      <View style={[st.card, glass(zone ? colourHex[MODULE_COLOUR[zone.n]] : c.navy)]}>
        {n && zone ? (
          <>
            <View style={st.cardTop}>
              <T style={st.cardK} numberOfLines={1}>
                {hello()}, {s.name || "there"} · {zone.name}
              </T>
              <T style={[st.cardK, { flexShrink: 0 }]}>{n.lesson.minutes} min</T>
            </View>
            <T style={st.cardT}>{n.lesson.title}</T>
            {rp && <T style={st.cardS}>Sit with {rp.who.name}, {rp.who.role.toLowerCase()}.</T>}
            <Button label={n.kind === "fire" ? "Sit by the fire" : "Continue"} onPress={() => router.push(`/lesson/${n.id}`)} />
          </>
        ) : (
          <>
            <T style={st.cardK}>Level 1 complete</T>
            <T style={st.cardT}>Leon can change colour.</T>
            <T style={st.cardS}>Level 2, the Listening Jungle, opens after your next ILN workshop.</T>
            <Button label="Open your profile" onPress={() => router.push("/you")} />
          </>
        )}
      </View>

      {cur?.k === "zone" && <ZoneArrival key={`z${cur.zone}`} zone={cur.zone} onDone={() => setQueue((q) => q.slice(1))} />}
      {cur?.k === "colour" && <ColourEarned key={`c${cur.module}`} from={cur.from} to={cur.to} module={cur.module} onDone={() => setQueue((q) => q.slice(1))} />}
    </View>
  );
}

/** A tiny dotted mark for the chips, after Pulse's dotted charts. */
function Dotty({ col }: { col: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 2, alignItems: "flex-end" }}>
      {[4, 7, 10].map((h, i) => (
        <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: col }} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  f: { flex: 1, overflow: "hidden", userSelect: "none", touchAction: "none" } as any,
  world: { position: "absolute", left: 0, top: 0, width: WORLD.w, height: WORLD.h, transformOrigin: "0 0", willChange: "transform" } as any,
  leon: { position: "absolute", left: 0, top: 0 },
  tag: { position: "absolute", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10 },
  tagK: { fontFamily: f.medium, fontSize: 15, lineHeight: 19, letterSpacing: 0.3, color: c.ink2 },
  tagT: { fontFamily: f.semibold, fontSize: 24, lineHeight: 29, letterSpacing: -0.5, color: c.navy },
  shore: { position: "absolute", left: 60, top: 1450 },
  shoreK: { fontFamily: f.medium, fontSize: 18, lineHeight: 22, color: c.navy, opacity: 0.6 },
  shoreT: { fontFamily: f.semibold, fontSize: 52, lineHeight: 56, letterSpacing: -2, color: c.navy },
  top: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: 12, gap: 8 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chip: { height: 40, borderRadius: 20, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  chipN: { fontFamily: f.semibold, fontSize: 18, lineHeight: 22, letterSpacing: -0.6, color: c.navy },
  chipU: { fontFamily: f.medium, fontSize: 11, lineHeight: 14, color: c.ink2 },
  greet: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, maxWidth: "100%" },
  greetT: { fontFamily: f.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.3, color: c.navy },
  find: { position: "absolute", left: 0, right: 0, bottom: 236, alignItems: "center" },
  findB: { height: 40, borderRadius: 20, paddingHorizontal: 18, justifyContent: "center" },
  findT: { fontFamily: f.semibold, fontSize: 14, lineHeight: 18, color: c.navy },
  card: { position: "absolute", left: 12, right: 12, bottom: 12, borderRadius: 24, padding: g, gap: 10, maxWidth: 496, alignSelf: "center" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardK: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, color: c.ink2, flexShrink: 1 },
  cardT: { fontFamily: f.semibold, fontSize: 21, lineHeight: 26, letterSpacing: -0.5, color: c.navy, marginBottom: 4 },
  cardS: { fontSize: 13, lineHeight: 19, color: c.ink2, marginTop: -6, marginBottom: 4 },
});
