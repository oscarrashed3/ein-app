import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Platform, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { Leon, type LeonHandle, type Mood } from "../components/Leon";
import { T } from "../components/T";
import { Lock } from "../components/Icons";
import { lessons } from "../content/level1";
import { LEVELS } from "../content/levels";
import { useProgress, type Skin } from "../state/progress";
import { c, f, glass } from "../theme";
import { JourneyHud } from "../world/JourneyHud";
import { ColourEarned, ZoneArrival } from "../world/Moments";
import { MODULE_COLOUR, layoutIsland, todNow } from "../world/world";
import { Canvas3D } from "./Canvas3D";
import { World, type StopState } from "./World";

const L = 120; // Leon's drawn width in px before perspective scaling
const LH = (L * 150) / 250;
const LEON_M = 1.7; // how wide Leon is in the world, in metres

type Moment = { k: "zone"; zone: 1 | 2 | 3 } | { k: "colour"; module: number; from: Skin; to: Skin };

/**
 * Journey as a 3D world: Quiet Shore at the bottom of a long climb. Drag (or scroll) to walk the path,
 * tap a lit stop to open its lesson. Leon is the same 2D character, standing in the world.
 */
export default function Journey3D() {
  const { s, ready, set, next, earned } = useProgress();
  const reduce = useReducedMotion();
  const nid = next();
  const target = nid ?? "end";
  const levelDone = !nid;
  const world = useMemo(() => new World(lessons), []);
  if (typeof window !== "undefined") (window as any).__einWorld = world; // for automated checks
  useEffect(() => () => world.dispose(), [world]);
  useEffect(() => world.setReduced(!!reduce), [reduce, world]);
  useEffect(() => world.setTod(s.tod === "auto" ? todNow() : s.tod), [s.tod, world]);
  const nodes = useMemo(() => layoutIsland().nodes, []);

  const [vp, setVp] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setVp({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // ---- Leon and the gate card follow the 3D world every frame ----
  const lx = useSharedValue(-999), ly = useSharedValue(-999), lk = useSharedValue(1);
  const gx = useSharedValue(-999), gy = useSharedValue(-999), gOn = useSharedValue(0), vpw = useSharedValue(390);
  const [away, setAway] = useState(false);
  const awayRef = useRef(false);
  const vpRef = useRef(vp);
  vpRef.current = vp;
  const onFrame = useCallback(() => {
    const p = world.leonScreen();
    const k = Math.max(0.25, Math.min(2.2, (p.ppm * LEON_M) / L));
    lx.value = p.x - L / 2 - 0.06 * L * k;
    ly.value = p.y - LH / 2 - 0.37 * LH * k;
    lk.value = k;
    const h = vpRef.current.h;
    vpw.value = vpRef.current.w;
    const off = !p.visible || p.y < 90 || p.y > h - 200;
    if (off !== awayRef.current) {
      awayRef.current = off;
      setAway(off);
    }
    const gt = world.gateScreen();
    gx.value = gt.x;
    gy.value = gt.y;
    const on = gt.visible && gt.y > 150 && gt.y < h - 280 ? 1 : 0;
    if (on !== gOn.value) gOn.value = withTiming(on, { duration: 260 });
  }, [world]);
  const leonStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lx.value }, { translateY: ly.value }, { scale: lk.value }] }));
  const gateStyle = useAnimatedStyle(() => ({ opacity: gOn.value, transform: [{ translateX: Math.max(12, Math.min(vpw.value - 292, gx.value - 140)) }, { translateY: Math.max(108, gy.value - 130) }] }));

  // ---- walking the path: drag, fling, wheel; a tap opens a stop ----
  const moved = useRef(false);
  const last = useRef(0);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dy) > 6,
        onPanResponderGrant: () => {
          moved.current = false;
          last.current = 0;
          world.dragStart();
        },
        onPanResponderMove: (_, gs) => {
          if (Math.abs(gs.dy) > 6 || Math.abs(gs.dx) > 6) moved.current = true;
          world.dragBy(gs.dy - last.current);
          last.current = gs.dy;
        },
        onPanResponderRelease: (e, gs) => {
          world.dragEnd(moved.current ? gs.vy : 0);
          if (!moved.current) {
            const { locationX, locationY } = e.nativeEvent;
            const id = world.pick(locationX, locationY);
            if (id && (stateRef.current[id] ?? "locked") !== "locked") router.push(`/lesson/${id}`);
          }
        },
        onPanResponderTerminate: () => world.dragEnd(0),
        onPanResponderTerminationRequest: () => false,
      }),
    [world],
  );
  const box = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const el = box.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      world.wheel(e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [world]);

  // ---- progress into the world ----
  const states = useMemo(() => {
    const o: Record<string, StopState> = {};
    for (const l of lessons) o[l.id] = s.done[l.id] ? "done" : l.id === nid ? "next" : "locked";
    return o;
  }, [s.done, nid]);
  const stateRef = useRef(states);
  stateRef.current = states;
  const walked = useMemo(() => [...lessons.map((l) => !!s.done[l.id] || l.id === nid), levelDone], [s.done, nid, levelDone]);
  const walkedRef = useRef(walked);
  walkedRef.current = walked;

  const [queue, setQueue] = useState<Moment[]>([]);
  const leon = useRef<LeonHandle>(null);
  const sRef = useRef(s);
  sRef.current = s;
  const laidOut = vp.w > 0;
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
      const from = st.mapAt && st.mapAt !== target ? st.mapAt : null;
      if (st.mapAt !== target || moments.length) set({ mapAt: target, zones, earnedSeen: seen, look: { ...st.look, skin } });

      if (from && !reduce) {
        // Start on the stop you just finished: it lights, the path fills, then Leon hops on and the camera follows.
        const seg = nid ? lessons.findIndex((l) => l.id === nid) : lessons.length;
        world.setProgress(stateRef.current, walkedRef.current, levelDone, from, seg);
        world.place(from as any, false);
        const a = setTimeout(() => world.fillSeg(seg), 500);
        const b = setTimeout(() => {
          leon.current?.emote("jump");
          world.hop(from as any, target as any, () => {
            setTimeout(() => leon.current?.emote("nod"), 120);
            if (moments.length) setTimeout(() => setQueue(moments), 500);
          });
        }, 900);
        return () => (clearTimeout(a), clearTimeout(b));
      }
      world.setProgress(stateRef.current, walkedRef.current, levelDone);
      world.place(target as any, false);
      if (moments.length) setQueue(moments);
    }, [ready, target, laidOut]),
  );

  const n = nid ? nodes.find((q) => q.id === nid)! : null;
  const evening = new Date().getHours() >= 21 || new Date().getHours() < 5;
  const mood: Mood = levelDone ? "proud" : evening ? "sleepy" : "calm";
  const cur = queue[0];
  const L2 = LEVELS[1];

  return (
    <View style={[st.f, { backgroundColor: c.navy }]}>
      <View ref={box} style={st.f} onLayout={onLayout} {...pan.panHandlers}>
        {laidOut && <Canvas3D world={world} onFrame={onFrame} />}
        <Animated.View style={[st.leon, leonStyle]} pointerEvents="box-none">
          <Leon ref={leon} mood={mood} size={L} ground={false} glow={false} />
        </Animated.View>
        <Animated.View style={[st.gate, glass(), gateStyle]} pointerEvents="none">
          <View style={st.gateRow}>
            <Lock size={16} color={c.navy} />
            <T style={st.gateK}>Level 2 · {L2.place}</T>
          </View>
          <T style={st.gateT}>{L2.title}</T>
          <T style={st.gateS}>{levelDone ? "Opens after your Level 2 workshop" : "Finish Level 1 to open"}</T>
        </Animated.View>
      </View>
      <JourneyHud n={n} vpw={vp.w} away={away} onBack={() => world.focusLeon(true)} leon={leon} />
      {cur?.k === "zone" && <ZoneArrival key={`z${cur.zone}`} zone={cur.zone} onDone={() => setQueue((q) => q.slice(1))} />}
      {cur?.k === "colour" && <ColourEarned key={`c${cur.module}`} from={cur.from} to={cur.to} module={cur.module} onDone={() => setQueue((q) => q.slice(1))} />}
    </View>
  );
}

const st = StyleSheet.create({
  f: { flex: 1, overflow: "hidden", userSelect: "none", touchAction: "none" } as any,
  leon: { position: "absolute", left: 0, top: 0, width: L, height: LH },
  gate: { position: "absolute", left: 0, top: 0, width: 280, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, gap: 1 },
  gateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  gateK: { fontFamily: f.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3, color: c.ink2 },
  gateT: { fontFamily: f.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.4, color: c.navy },
  gateS: { fontFamily: f.medium, fontSize: 13, lineHeight: 18, color: c.ink2 },
});
