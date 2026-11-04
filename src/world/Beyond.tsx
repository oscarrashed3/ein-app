import { memo } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Levels 2 to 4, above Quiet Shore: one continuous climb, redrawn as vector from Oscar's
 * "Journey to the Cloud Summit" picture. Same 1024-unit width as the island.
 * Bottom to top: the sea crossing and jetty, the Listening Jungle, clouds, Ember Ridge,
 * clouds, and The Table on a plateau under the stars.
 * Static: drawn once. Each place stands for what that module teaches.
 */
export const BEYOND = { w: 1024, h: 2640 };
/** Where Quiet Shore's own sea line (y 230 in Island units) meets this drawing. */
export const SHORE_OFFSET = 2370;

/** Stops on the path above Level 1, bottom to top. kind: place (a module), fire (campfire), summit. */
export const BEYOND_STOPS: { x: number; y: number; kind: "place" | "fire" | "summit" | "jetty"; level: 2 | 3 | 4 }[] = [
  { x: 512, y: 2330, kind: "jetty", level: 2 },
  { x: 360, y: 2185, kind: "place", level: 2 },
  { x: 540, y: 2105, kind: "fire", level: 2 },
  { x: 660, y: 1995, kind: "place", level: 2 },
  { x: 500, y: 1925, kind: "fire", level: 2 },
  { x: 360, y: 1830, kind: "place", level: 2 },
  { x: 530, y: 1745, kind: "fire", level: 2 },
  { x: 650, y: 1505, kind: "place", level: 3 },
  { x: 480, y: 1440, kind: "fire", level: 3 },
  { x: 360, y: 1345, kind: "place", level: 3 },
  { x: 530, y: 1275, kind: "fire", level: 3 },
  { x: 660, y: 1185, kind: "place", level: 3 },
  { x: 512, y: 1110, kind: "fire", level: 3 },
  { x: 360, y: 715, kind: "place", level: 4 },
  { x: 530, y: 645, kind: "fire", level: 4 },
  { x: 650, y: 555, kind: "place", level: 4 },
  { x: 480, y: 485, kind: "fire", level: 4 },
  { x: 360, y: 400, kind: "place", level: 4 },
  { x: 530, y: 330, kind: "fire", level: 4 },
  { x: 512, y: 215, kind: "summit", level: 4 },
];
/** The gate at the start of each level: the path is closed here until the level before is finished. */
export const GATES = [
  { n: 2 as const, x: 512, y: 2372 },
  { n: 3 as const, x: 512, y: 1640 },
  { n: 4 as const, x: 512, y: 840 },
];
/** Each locked land's span, for the veil drawn over it. */
export const LAND_SPAN: Record<2 | 3 | 4, [number, number]> = { 2: [1700, 2372], 3: [930, 1640], 4: [0, 840] };
/** Level title tags: where each land's name sits. */
export const LEVEL_TAGS = [
  { n: 2, x: 250, y: 2240 },
  { n: 3, x: 250, y: 1560 },
  { n: 4, x: 250, y: 790 },
];

function dots(pts: { x: number; y: number }[], gap = 26) {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(d / gap));
    for (let k = 1; k < n; k++) {
      const t = k / n;
      // a gentle curve between stops
      const bend = Math.sin(t * Math.PI) * (i % 2 ? 18 : -18);
      out.push([a.x + (b.x - a.x) * t + bend, a.y + (b.y - a.y) * t]);
    }
  }
  return out;
}
// The path also climbs from the Lookout's telescope (Island y 330 → 2370 + 330 - 230) to the jetty.
const PATH = [{ x: 517, y: SHORE_OFFSET + 100 }, ...BEYOND_STOPS];
const DOTS = dots(PATH);

function Gate({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 34} rx={110} ry={14} fill="#000" opacity={0.08} />
      {[-78, 78].map((d) => (
        <G key={d}>
          <Rect x={x + d - 9} y={y - 60} width={18} height={96} rx={6} fill="#8B6B4A" />
          <Rect x={x + d - 12} y={y - 66} width={24} height={12} rx={5} fill="#A3845F" />
        </G>
      ))}
      <Path d={`M${x - 70} ${y - 34} Q${x} ${y - 6} ${x + 70} ${y - 34}`} stroke="#6F6A80" strokeWidth={6} fill="none" strokeDasharray="10 6" strokeLinecap="round" />
      <Path d={`M${x - 70} ${y - 6} Q${x} ${y + 20} ${x + 70} ${y - 6}`} stroke="#6F6A80" strokeWidth={6} fill="none" strokeDasharray="10 6" strokeLinecap="round" />
    </G>
  );
}

function Cloud({ x, y, k = 1, o = 1 }: { x: number; y: number; k?: number; o?: number }) {
  return (
    <G opacity={o} transform={`translate(${x} ${y}) scale(${k})`}>
      <Ellipse cx={0} cy={20} rx={170} ry={42} fill="#F6EAF3" />
      <Circle cx={-70} cy={0} r={52} fill="#F9F0F6" />
      <Circle cx={10} cy={-22} r={66} fill="#FCF5F8" />
      <Circle cx={90} cy={4} r={48} fill="#F4E6F0" />
    </G>
  );
}
function Tree({ x, y, k = 1, c1 = "#6FA77C", c2 = "#86BC8C" }: { x: number; y: number; k?: number; c1?: string; c2?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Path d="M-6 0 L-4 -60 L4 -60 L6 0Z" fill="#7B5A3E" />
      <Circle cx={-24} cy={-70} r={30} fill={c1} />
      <Circle cx={22} cy={-74} r={32} fill={c1} />
      <Circle cx={0} cy={-96} r={34} fill={c2} />
    </G>
  );
}
function Fire({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={60} ry={26} fill="url(#bFire)" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Ellipse key={i} cx={x + Math.cos(a) * 30} cy={y + 4 + Math.sin(a) * 12} rx={8} ry={5} fill="#A89A9E" />;
      })}
      <Path d={`M${x} ${y - 30} C${x + 14} ${y - 14} ${x + 12} ${y + 2} ${x} ${y + 4} C${x - 12} ${y + 2} ${x - 14} ${y - 14} ${x} ${y - 30}Z`} fill="#F4B23E" />
      <Path d={`M${x} ${y - 16} C${x + 7} ${y - 6} ${x + 6} ${y + 2} ${x} ${y + 3} C${x - 6} ${y + 2} ${x - 7} ${y - 6} ${x} ${y - 16}Z`} fill="#FFE7A6" />
    </G>
  );
}
function Stars() {
  const s: [number, number, number][] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 70; i++) s.push([rnd() * 1024, rnd() * 380, 1 + rnd() * 2.4]);
  return (
    <G>
      {s.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.5 + (i % 3) * 0.15} />
      ))}
    </G>
  );
}

export const Beyond = memo(function Beyond() {
  const { w: W, h: H } = BEYOND;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <LinearGradient id="bSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2B1F5C" />
          <Stop offset="0.12" stopColor="#5B3F8E" />
          <Stop offset="0.25" stopColor="#B88BC4" />
          <Stop offset="0.42" stopColor="#F2C4B2" />
          <Stop offset="0.62" stopColor="#F8DDC8" />
          <Stop offset="0.8" stopColor="#EADCE6" />
          <Stop offset="1" stopColor="#E3CBDD" />
        </LinearGradient>
        <LinearGradient id="bMesa" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9B7C9" />
          <Stop offset="1" stopColor="#9C88A8" />
        </LinearGradient>
        <LinearGradient id="bCliff" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8E7A9C" />
          <Stop offset="1" stopColor="#B9A3C0" stopOpacity={0.4} />
        </LinearGradient>
        <LinearGradient id="bRidge" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E7B79A" />
          <Stop offset="1" stopColor="#C98E7C" />
        </LinearGradient>
        <LinearGradient id="bRidgeCliff" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B57B70" />
          <Stop offset="1" stopColor="#D7A595" stopOpacity={0.3} />
        </LinearGradient>
        <LinearGradient id="bJungle" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8FBF8A" />
          <Stop offset="1" stopColor="#C9DE9A" />
        </LinearGradient>
        <LinearGradient id="bWater" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9FC9E6" />
          <Stop offset="0.6" stopColor="#C6C2EA" />
          <Stop offset="1" stopColor="#E3CBDD" />
        </LinearGradient>
        <RadialGradient id="bGold" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFE6A3" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="bFire" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFD27A" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="bLava" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFC56E" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#FF9E5E" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="bSpring" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BDEBEF" />
          <Stop offset="1" stopColor="#7FCFD8" />
        </LinearGradient>
        <LinearGradient id="bMirror" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EAF4FF" />
          <Stop offset="0.5" stopColor="#C9D8F3" />
          <Stop offset="1" stopColor="#F3E6FF" />
        </LinearGradient>
      </Defs>

      {/* Sky: night at the top, through dusk and afternoon, to dawn over Quiet Shore */}
      <Rect x={0} y={0} width={W} height={H} fill="url(#bSky)" />
      <Stars />
      <Path d="M0 0 L240 0 L520 260Z M1024 60 L1024 160 L600 300Z" fill="#FFFFFF" opacity={0.06} />

      {/* ───── Level 4 · The Table: a plateau above the clouds ───── */}
      <Path d="M120 820 C140 700 170 560 220 430 C250 340 300 250 380 200 L650 200 C730 250 780 330 810 430 C860 560 890 700 910 820Z" fill="url(#bCliff)" />
      <Path d="M170 470 C220 380 300 290 400 236 L630 236 C720 290 800 380 860 470 C780 500 640 520 512 520 C380 520 250 500 170 470Z" fill="url(#bMesa)" />
      <Path d="M200 760 C260 700 380 680 512 684 C650 680 770 700 830 760 C760 790 640 800 512 800 C380 800 270 790 200 760Z" fill="#B7A4BF" />
      <Path d="M340 220 C420 196 600 196 690 220 C640 240 400 240 340 220Z" fill="#D9CAD7" />
      {/* the summit glow and the table with a chair on each side */}
      <Ellipse cx={512} cy={190} rx={240} ry={130} fill="url(#bGold)" />
      <Ellipse cx={512} cy={214} rx={74} ry={14} fill="#8C6C55" opacity={0.35} />
      <Ellipse cx={512} cy={184} rx={66} ry={14} fill="#C9A27A" />
      <Rect x={505} y={186} width={14} height={28} fill="#9C7A5A" />
      {[-1, 1].map((s) => (
        <G key={s} transform={`translate(${512 + s * 112} 190) scale(${s} 1)`}>
          <Path d="M-30 -42 C-30 -56 30 -56 30 -42 L30 10 L-30 10Z" fill="#E9DDD4" />
          <Rect x={-36} y={-6} width={72} height={20} rx={9} fill="#F3EAE2" />
          <Path d="M-24 14 L-26 30 M24 14 L26 30" stroke="#9C8577" strokeWidth={5} strokeLinecap="round" />
        </G>
      ))}
      {/* The Storm Pass: storm clouds over a narrow pass, a flash of gold */}
      <Path d="M250 740 L300 610 L330 700 L360 590 L400 740Z" fill="#7D6B8E" />
      <Cloud x={340} y={600} k={0.62} o={0.95} />
      <G>
        <Ellipse cx={330} cy={590} rx={90} ry={30} fill="#6E6585" />
        <Circle cx={300} cy={572} r={30} fill="#7B7393" />
        <Circle cx={350} cy={566} r={36} fill="#857C9C" />
      </G>
      <Path d="M352 600 L336 640 L352 640 L334 684" stroke="#FFD66E" strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* The Terraces: stepped gardens, ripe fruit trees */}
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={590 - i * 20} y={600 - i * 34} width={130 + i * 40} height={30} rx={10} fill={["#A98FA8", "#B79EB4", "#C5AFC1"][i]} />
      ))}
      {[[600, 566, 0.5], [700, 560, 0.55], [640, 530, 0.5], [740, 528, 0.45]].map(([x, y, k], i) => (
        <G key={i}>
          <Tree x={x} y={y} k={k} c1="#7EA978" c2="#93BC86" />
          <Circle cx={x - 8} cy={y - 40 * k * 2} r={5} fill="#F2A33C" />
          <Circle cx={x + 10} cy={y - 34 * k * 2} r={5} fill="#F2A33C" />
        </G>
      ))}
      {/* The Hall of Mirrors: tall warped mirror arches in mist */}
      {[[290, 380, 1], [330, 372, 1.15], [372, 384, 0.95], [414, 378, 1.05]].map(([x, y, k], i) => (
        <G key={i}>
          <Path d={`M${x - 16 * k} ${y + 40} L${x - 16 * k} ${y - 30 * k} C${x - 16 * k} ${y - 56 * k} ${x + 16 * k} ${y - 56 * k} ${x + 16 * k} ${y - 30 * k} L${x + 16 * k} ${y + 40}Z`} fill="#9C8EB6" />
          <Path d={`M${x - 11 * k} ${y + 36} L${x - 11 * k} ${y - 28 * k} C${x - 11 * k} ${y - 48 * k} ${x + 11 * k} ${y - 48 * k} ${x + 11 * k} ${y - 28 * k} L${x + 11 * k} ${y + 36}Z`} fill="url(#bMirror)" />
        </G>
      ))}
      <Ellipse cx={350} cy={426} rx={110} ry={18} fill="#FFFFFF" opacity={0.35} />

      {/* Clouds between The Table and Ember Ridge */}
      <Rect x={0} y={800} width={W} height={150} fill="#F4E2EC" opacity={0.6} />
      <Cloud x={120} y={830} k={1.2} />
      <Cloud x={520} y={880} k={1.4} />
      <Cloud x={900} y={820} k={1.1} />

      {/* ───── Level 3 · Ember Ridge ───── */}
      {/* the volcano with a stone stairway up to The Table */}
      <Path d="M260 1160 C360 1080 440 990 490 960 C505 952 520 952 535 960 C585 990 670 1080 770 1160Z" fill="#D19A86" />
      <Ellipse cx={512} cy={952} rx={70} ry={34} fill="url(#bLava)" />
      <Path d="M492 958 C505 950 520 950 532 958 L524 972 L500 972Z" fill="#F7A86A" />
      {Array.from({ length: 8 }, (_, i) => (
        <Rect key={i} x={494 - i * 3} y={980 + i * 20} width={36 + i * 6} height={8} rx={3} fill="#E9C2AE" opacity={0.85} />
      ))}
      <Path d="M80 1610 C100 1450 150 1290 240 1180 C320 1130 420 1120 512 1120 C610 1120 700 1130 780 1180 C880 1290 930 1450 950 1610Z" fill="url(#bRidgeCliff)" />
      <Path d="M150 1300 C210 1210 330 1160 512 1160 C700 1160 820 1210 880 1300 C860 1420 820 1490 760 1540 C660 1560 360 1560 260 1540 C200 1490 160 1420 150 1300Z" fill="url(#bRidge)" />
      {/* The Echo Canyon: two curved rock walls, sound rings in the air */}
      <Path d="M590 1560 C580 1500 586 1440 606 1400 C616 1380 632 1384 630 1410 C626 1460 624 1510 632 1560Z" fill="#B76E5E" />
      <Path d="M690 1560 C700 1500 696 1440 676 1400 C666 1380 650 1384 652 1410 C656 1460 658 1510 650 1560Z" fill="#A9604F" />
      {[18, 32, 46].map((r) => (
        <Circle key={r} cx={641} cy={1460} r={r} stroke="#FFF3E6" strokeWidth={2.5} fill="none" opacity={0.75 - r / 100} />
      ))}
      {/* The Hot Springs: steaming pools, each a little cooler and bluer */}
      {[[300, 1370, "#F1C9A8"], [355, 1335, "#D4E2D9"], [410, 1366, "#BDEBEF"], [362, 1396, "#A7E2EA"]].map(([x, y, col], i) => (
        <G key={i}>
          <Ellipse cx={x as number} cy={(y as number) + 4} rx={44} ry={16} fill="#9C6A5E" />
          <Ellipse cx={x as number} cy={y as number} rx={40} ry={13} fill={col as string} />
          <Path d={`M${(x as number) - 8} ${(y as number) - 10} q-8 -14 0 -26 q8 -12 0 -24`} stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={0.55} strokeLinecap="round" />
        </G>
      ))}
      {/* The Forge: an anvil, a glowing crucible and floating crystals that fit together */}
      <Rect x={620} y={1150} width={18} height={70} rx={4} fill="#9A7A76" />
      <Rect x={720} y={1150} width={18} height={70} rx={4} fill="#9A7A76" />
      <Path d="M640 1200 L700 1200 C700 1210 690 1214 680 1214 L676 1230 L664 1230 L660 1214 C650 1214 640 1210 640 1200Z" fill="#4A4060" />
      <Path d="M636 1196 L712 1196 C708 1190 700 1188 690 1188 L650 1188 C642 1188 638 1190 636 1196Z" fill="#5C5274" />
      <Ellipse cx={712} cy={1218} rx={30} ry={18} fill="url(#bLava)" />
      <Rect x={700} y={1212} width={24} height={16} rx={4} fill="#5C4848" />
      {[[650, 1120, "#C7A6F2"], [676, 1100, "#A6C7F2"], [700, 1126, "#E8B6F0"], [664, 1150, "#B7E0F4"]].map(([x, y, col], i) => (
        <Path key={i} d={`M${x} ${(y as number) - 16} L${(x as number) + 9} ${y} L${x} ${(y as number) + 16} L${(x as number) - 9} ${y}Z`} fill={col as string} opacity={0.95} />
      ))}

      {/* Clouds between Ember Ridge and the jungle */}
      <Rect x={0} y={1580} width={W} height={130} fill="#F7E8EE" opacity={0.55} />
      <Cloud x={80} y={1610} k={1.1} />
      <Cloud x={460} y={1650} k={1.3} o={0.95} />
      <Cloud x={920} y={1600} k={1.2} />

      {/* ───── Level 2 · The Listening Jungle ───── */}
      <Path d="M-20 2300 C-10 2000 40 1820 140 1740 C300 1700 720 1700 880 1740 C980 1820 1034 2000 1044 2300Z" fill="url(#bJungle)" />
      {[[90, 1800], [190, 1760], [300, 1745], [420, 1730], [620, 1730], [740, 1745], [850, 1770], [950, 1810]].map(([x, y], i) => (
        <Tree key={i} x={x} y={y + 70} k={1.2} c1={i % 2 ? "#5E9A70" : "#6FA77C"} c2={i % 2 ? "#78B184" : "#86BC8C"} />
      ))}
      {/* the waterfall */}
      <Path d="M800 1780 L840 1780 L846 1900 L794 1900Z" fill="#DDF1F7" />
      <Path d="M808 1790 L812 1890 M822 1790 L824 1894 M834 1790 L836 1890" stroke="#FFFFFF" strokeWidth={3} opacity={0.8} />
      <Ellipse cx={820} cy={1904} rx={44} ry={12} fill="#FFFFFF" opacity={0.7} />
      {/* clearing */}
      <Path d="M120 2280 C140 2160 260 2080 512 2070 C760 2080 880 2160 900 2280Z" fill="#D9E6A2" />
      {/* The Hourglass Clearing: two big trees whose trunks narrow, then open into light */}
      <Ellipse cx={360} cy={2160} rx={60} ry={70} fill="url(#bGold)" />
      <Path d="M300 2230 C306 2180 330 2150 336 2100 L324 2100 C318 2150 290 2180 284 2230Z" fill="#7B5A3E" />
      <Path d="M420 2230 C414 2180 390 2150 384 2100 L396 2100 C402 2150 430 2180 436 2230Z" fill="#7B5A3E" />
      <Circle cx={318} cy={2088} r={44} fill="#5E9A70" />
      <Circle cx={402} cy={2088} r={44} fill="#5E9A70" />
      <Circle cx={360} cy={2066} r={40} fill="#78B184" />
      {/* The Canopy Walk: two tree houses joined by a rope walkway */}
      {[[620, 2020, 1], [730, 2034, 0.75]].map(([x, y, k], i) => (
        <G key={i} transform={`translate(${x} ${y}) scale(${k})`}>
          <Rect x={-6} y={0} width={12} height={60} fill="#7B5A3E" />
          <Circle cx={0} cy={-40} r={44} fill="#6FA77C" />
          <Rect x={-30} y={-20} width={60} height={30} rx={4} fill="#B98B5E" />
          <Path d="M-38 -20 L0 -46 L38 -20Z" fill="#8F6440" />
          <Rect x={-6} y={-12} width={12} height={18} rx={2} fill="#6A4A30" />
        </G>
      ))}
      <Path d="M650 2016 Q676 2032 708 2020" stroke="#8F6440" strokeWidth={4} fill="none" />
      <Path d="M650 2008 Q676 2024 708 2012" stroke="#B98B5E" strokeWidth={2} fill="none" />
      {/* The Vine Gate: an arch of vines that stays open */}
      <Path d="M318 1880 L318 1810 C318 1758 402 1758 402 1810 L402 1880" stroke="#5E8A5E" strokeWidth={16} fill="none" strokeLinecap="round" />
      {[[320, 1830], [330, 1790], [360, 1772], [392, 1790], [402, 1834], [318, 1860], [404, 1864]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={9} fill={i % 3 ? "#7FB07A" : "#F2B7C9"} />
      ))}
      {/* fireflies */}
      {[[230, 1960], [470, 1980], [780, 1980], [560, 2200], [260, 2240], [860, 2120]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={4} fill="#FFF1A8" opacity={0.9} />
      ))}
      {/* the crossing: water, jetty and a little ferry */}
      <Path d="M-20 2290 C300 2270 700 2300 1044 2280 V2640 H-20Z" fill="url(#bWater)" />
      <Path d="M-20 2290 C300 2270 700 2300 1044 2280" stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={0.7} />
      {[[120, 2360], [300, 2420], [720, 2380], [880, 2450], [220, 2520], [780, 2540]].map(([x, y], i) => (
        <Path key={i} d={`M${x} ${y} q20 -7 40 0 t40 0`} stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.5} strokeLinecap="round" />
      ))}
      <Rect x={472} y={2290} width={80} height={60} rx={4} fill="#A3845F" />
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={474} y={2296 + i * 14} width={76} height={4} fill="#8B6B4A" opacity={0.6} />
      ))}
      {[478, 546].map((x) => (
        <Rect key={x} x={x - 4} y={2280} width={8} height={84} rx={3} fill="#7A5A3A" />
      ))}
      <G transform="translate(330 2340)">
        <Path d="M-70 0 L70 0 C60 22 40 30 0 30 C-40 30 -60 22 -70 0Z" fill="#9C6F48" />
        <Rect x={-44} y={-38} width={88} height={6} rx={3} fill="#C9A27A" />
        <Path d="M-40 -32 L-40 0 M40 -32 L40 0" stroke="#7A5A3A" strokeWidth={4} />
      </G>

      {/* The path up through every land: faint footprints, the stops lit softly */}
      {DOTS.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={6} fill="#FFF4DE" opacity={0.85} />
      ))}
      {GATES.map((g) => (
        <Gate key={g.n} x={g.x} y={g.y} />
      ))}
      {BEYOND_STOPS.filter((s) => s.kind === "fire").map((s, i) => (
        <Fire key={i} x={s.x} y={s.y} />
      ))}
    </Svg>
  );
});
