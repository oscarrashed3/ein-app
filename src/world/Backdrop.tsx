import { memo } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { c } from "../theme";
import { dotsBetween, type Palette, type World } from "./world";

/** Seeded random, so the scenery is the same on every render and every device. */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/**
 * The painted world: beach, tide pool, river, hill and horizon. Drawn once, static, no animation,
 * so scrolling only moves a finished picture.
 */
export const Backdrop = memo(function Backdrop({ w, pal, fog }: { w: World; pal: Palette; fog: number }) {
  const { W, H, zones, nodes, lookout, horizon } = w;
  const z1 = nodes.filter((n) => n.zone === 1 && n.kind !== "fire");
  const z2 = nodes.filter((n) => n.zone === 2 && n.kind !== "fire");
  const r = rng(7);
  const tufts = Array.from({ length: 26 }, () => ({ x: r() * W, y: horizon + 220 + r() * (H - horizon - 600) }));
  const stars = pal.night ? Array.from({ length: 40 }, () => ({ x: r() * W, y: r() * (horizon - 120), r: 0.6 + r() * 1.3 })) : [];
  const poolTop = z1[z1.length - 1].y - 60, poolBot = z1[0].y + 34;
  const rivTop = z2[z2.length - 1].y - 40, rivBot = z2[0].y + 36;
  const hillBase = zones[2].bottom + 40;
  const sea = horizon - 40;

  return (
    <Svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.sky[0]} />
          <Stop offset="1" stopColor={pal.sky[1]} />
        </LinearGradient>
        <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.water2} />
          <Stop offset="1" stopColor={pal.water} />
        </LinearGradient>
        <LinearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.water2} />
          <Stop offset="0.55" stopColor={pal.water} />
          <Stop offset="1" stopColor={pal.ground} />
        </LinearGradient>
        <LinearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.mist} stopOpacity={0} />
          <Stop offset="0.5" stopColor={pal.mist} stopOpacity={0.85} />
          <Stop offset="1" stopColor={pal.mist} stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id="ember" cx="50%" cy="60%" r="50%">
          <Stop offset="0" stopColor={c.gold} stopOpacity={0.55} />
          <Stop offset="1" stopColor={c.gold} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="pool" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.water2} />
          <Stop offset="1" stopColor={pal.water} />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={W} height={H} fill={pal.ground} />

      {/* Horizon: sky, sea, and the islands still to come, in mist */}
      <Rect x={0} y={0} width={W} height={sea + 10} fill="url(#sky)" />
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.7} />
      ))}
      <Path d={`M0 ${sea} Q${W * 0.25} ${sea - 8} ${W * 0.5} ${sea} T${W} ${sea} V${hillBase - 60} H0Z`} fill="url(#ocean)" />
      {/* The Table, Level 4: far away, a tiny summit with two chairs */}
      <G opacity={0.45}>
        <Path d={`M${W * 0.62} ${sea - 2} L${W * 0.7} ${sea - 34} L${W * 0.78} ${sea - 2}Z`} fill={pal.night ? "#2C2B70" : "#B9B4C9"} />
        <Rect x={W * 0.695} y={sea - 42} width={4} height={6} rx={2} fill={c.purple} />
        <Rect x={W * 0.705} y={sea - 42} width={4} height={6} rx={2} fill={c.mint} />
      </G>
      {/* Ember Ridge, Level 3 */}
      <G opacity={0.6}>
        <Ellipse cx={W * 0.86} cy={sea - 18} rx={70} ry={40} fill="url(#ember)" />
        <Path d={`M${W * 0.72} ${sea + 2} L${W * 0.8} ${sea - 30} L${W * 0.84} ${sea - 22} L${W * 0.9} ${sea - 44} L${W + 10} ${sea + 2}Z`} fill={pal.night ? "#3A2A55" : "#D3B9A5"} />
      </G>
      {/* The Listening Jungle, Level 2: the next island, big and close */}
      <G>
        <Path d={`M${W * 0.02} ${sea + 14} C${W * 0.06} ${sea - 60} ${W * 0.2} ${sea - 96} ${W * 0.34} ${sea - 84} C${W * 0.46} ${sea - 110} ${W * 0.6} ${sea - 60} ${W * 0.66} ${sea + 14}Z`} fill={pal.night ? "#173B44" : "#7FB79A"} />
        {[0.1, 0.18, 0.27, 0.36, 0.45, 0.54].map((k, i) => (
          <Circle key={i} cx={W * k} cy={sea - 62 - (i % 3) * 14 + (i === 0 || i === 5 ? 30 : 0)} r={20 + (i % 2) * 8} fill={pal.night ? "#1D4A50" : i % 2 ? "#6BA98A" : "#8CC3A6"} />
        ))}
        <Path d={`M${W * 0.3} ${sea - 70} q-2 -34 10 -50 M${W * 0.3 + 10} ${sea - 120} q-16 -4 -26 6 M${W * 0.3 + 10} ${sea - 120} q14 -6 24 4`} stroke={pal.night ? "#2A6A66" : "#4E8F6E"} strokeWidth={3} fill="none" strokeLinecap="round" />
      </G>
      <Rect x={0} y={sea - 140} width={W} height={180} fill="url(#mist)" opacity={fog} />

      {/* The Lookout hill: two soft mounds, the front one carrying the camp */}
      <Path d={`M-40 ${hillBase} C${W * 0.2} ${hillBase - 160} ${W * 0.55} ${lookout.y + 120} ${W * 0.9} ${lookout.y + 150} C${W * 1.05} ${lookout.y + 160} ${W + 40} ${lookout.y + 200} ${W + 40} ${lookout.y + 220} V${hillBase + 60} H-40Z`} fill={pal.hill2} />
      <Path d={`M-40 ${hillBase + 30} C${W * 0.05} ${hillBase - 220} ${lookout.x - 170} ${lookout.y - 8} ${lookout.x} ${lookout.y - 6} C${lookout.x + 150} ${lookout.y - 4} ${W * 0.95} ${hillBase - 260} ${W + 40} ${hillBase - 60} V${hillBase + 120} H-40Z`} fill={pal.hill} />
      {/* Telescope at the top, pointed at the jungle */}
      <G>
        <Path d={`M${lookout.x} ${lookout.y - 18} l-12 26 M${lookout.x} ${lookout.y - 18} l12 26 M${lookout.x} ${lookout.y - 18} l0 26`} stroke={pal.ink} strokeWidth={2.4} strokeLinecap="round" />
        <Path d={`M${lookout.x - 26} ${lookout.y - 38} L${lookout.x + 8} ${lookout.y - 20}`} stroke={pal.ink} strokeWidth={9} strokeLinecap="round" />
        <Path d={`M${lookout.x - 30} ${lookout.y - 41} L${lookout.x - 22} ${lookout.y - 36}`} stroke={c.gold} strokeWidth={11} strokeLinecap="round" />
      </G>

      {/* The River Crossing: a river with a rope bridge */}
      <Path d={`M-20 ${rivBot} C${W * 0.3} ${rivBot + 30} ${W * 0.6} ${rivBot - 30} ${W + 20} ${rivBot + 10} V${rivTop - 10} C${W * 0.6} ${rivTop + 20} ${W * 0.35} ${rivTop - 30} -20 ${rivTop}Z`} fill="url(#sea)" />
      {Array.from({ length: 7 }, (_, i) => {
        const y = rivTop + ((rivBot - rivTop) * (i + 0.5)) / 7;
        const x = (i % 2 ? 0.12 : 0.62) * W;
        return <Path key={i} d={`M${x} ${y} q14 -5 28 0 t28 0`} stroke="#fff" strokeOpacity={pal.night ? 0.25 : 0.7} strokeWidth={2} fill="none" strokeLinecap="round" />;
      })}
      {[-46, 46].map((dx) => (
        <G key={dx}>
          <Path d={`M${W / 2 + dx} ${rivBot + 16} C${W / 2 + dx * 1.04} ${(rivBot + rivTop) / 2} ${W / 2 + dx * 0.96} ${(rivBot + rivTop) / 2} ${W / 2 + dx} ${rivTop - 28}`} stroke={pal.night ? "#8C88C8" : "#7A6248"} strokeWidth={2} fill="none" />
          <Rect x={W / 2 + dx - 3} y={rivBot + 8} width={6} height={18} rx={3} fill={pal.night ? "#8C88C8" : "#7A6248"} />
          <Rect x={W / 2 + dx - 3} y={rivTop - 36} width={6} height={18} rx={3} fill={pal.night ? "#8C88C8" : "#7A6248"} />
        </G>
      ))}

      {/* The Seven Stones: a tide pool */}
      <Path d={`M${W * 0.5} ${poolBot + 26} C${W * 0.18} ${poolBot + 34} ${W * 0.03} ${poolBot - 40} ${W * 0.05} ${poolBot - 160} C${W * 0.07} ${(poolTop + poolBot) / 2 + 40} ${-W * 0.04} ${poolTop + 160} ${W * 0.12} ${poolTop + 40} C${W * 0.26} ${poolTop - 30} ${W * 0.62} ${poolTop - 10} ${W * 0.86} ${poolTop + 50} C${W * 1.04} ${poolTop + 110} ${W * 0.9} ${(poolTop + poolBot) / 2} ${W * 0.96} ${poolBot - 150} C${W * 1.0} ${poolBot - 40} ${W * 0.8} ${poolBot + 20} ${W * 0.5} ${poolBot + 26}Z`} fill="url(#pool)" />
      {z1.map((n) => (
        <Ellipse key={n.id} cx={n.x} cy={n.y + 6} rx={46} ry={20} stroke="#fff" strokeOpacity={pal.night ? 0.2 : 0.65} strokeWidth={1.5} fill="none" />
      ))}

      {/* Grass tufts on the meadow */}
      {tufts.map((t, i) => (
        <Path key={i} d={`M${t.x} ${t.y} q-2 -7 -5 -9 M${t.x} ${t.y} q0 -8 1 -11 M${t.x} ${t.y} q3 -6 6 -8`} stroke={pal.night ? "#2C3B72" : "#B9CDA8"} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      ))}

      {/* Quiet Shore: the beach where Leon starts, and the sea he came from */}
      <Path d={`M0 ${H - 330} C${W * 0.3} ${H - 360} ${W * 0.7} ${H - 300} ${W} ${H - 340} V${H} H0Z`} fill={pal.sand} />
      <Path d={`M0 ${H - 120} C${W * 0.3} ${H - 140} ${W * 0.6} ${H - 100} ${W} ${H - 130} V${H} H0Z`} fill={pal.sand2} />
      <Path d={`M0 ${H - 64} C${W * 0.25} ${H - 80} ${W * 0.6} ${H - 50} ${W} ${H - 70} V${H} H0Z`} fill="url(#sea)" />
      <Path d={`M0 ${H - 64} C${W * 0.25} ${H - 80} ${W * 0.6} ${H - 50} ${W} ${H - 70}`} stroke="#fff" strokeOpacity={0.8} strokeWidth={3} fill="none" />
      {[0.2, 0.5, 0.78].map((k, i) => (
        <Ellipse key={i} cx={W * k} cy={H - 200 - i * 26} rx={5} ry={3} fill={pal.sand2} />
      ))}
    </Svg>
  );
});

/**
 * The path, in dots, after Pulse's spiral runway. Walked dots are bigger and take the colour
 * of the module they belong to; dots still ahead are small and sandy.
 */
export const Dots = memo(function Dots({ w, colourOf, walked, only, offColour, W, H, scale = 1 }: { w: World; colourOf: (i: number) => string; walked: (i: number) => boolean; only?: number; offColour: string; W: number; H: number; scale?: number }) {
  const pts = [w.start, ...w.nodes, w.lookout];
  const segs: { x: number; y: number; on: boolean; col: string }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (only !== undefined && i !== only) continue;
    const on = only !== undefined ? true : walked(i);
    const ds = dotsBetween(pts[i], pts[i + 1], 13 * scale);
    ds.forEach((d) => segs.push({ ...d, on, col: colourOf(i) }));
  }
  return (
    <Svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
      {segs.map((d, k) => (
        <Circle key={k} cx={d.x} cy={d.y} r={(d.on ? 3.6 : 2.4) * scale} fill={d.on ? d.col : offColour} />
      ))}
    </Svg>
  );
});

/** Long soft streaks of light behind each zone, after Shorelines. They drift a little slower than the map. */
export const Leaks = memo(function Leaks({ w, night }: { w: World; night: boolean }) {
  return (
    <Svg width={w.W} height={w.H} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
      <Defs>
        {w.zones.map((z) => (
          <RadialGradient key={z.n} id={`leak${z.n}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={z.leak[0]} stopOpacity={night ? 0.2 : 0.3} />
            <Stop offset="0.55" stopColor={z.leak[1]} stopOpacity={night ? 0.08 : 0.1} />
            <Stop offset="1" stopColor={z.leak[1]} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {w.zones.map((z, i) => (
        <Ellipse key={z.n} cx={i % 2 ? w.W * 0.25 : w.W * 0.8} cy={(z.top + z.bottom) / 2} rx={w.W * 0.95} ry={64} fill={`url(#leak${z.n})`} transform={`rotate(${i % 2 ? 16 : -16} ${i % 2 ? w.W * 0.25 : w.W * 0.8} ${(z.top + z.bottom) / 2})`} />
      ))}
    </Svg>
  );
});
