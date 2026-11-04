import { memo } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import type { MapNode } from "./world";

/**
 * Quiet Shore, redrawn as vector from Oscar's painted island (1024 x 1536 world units).
 * Dawn sun on the left, the Listening Jungle in mist across the water, a volcano far behind,
 * the hill camp with the telescope, the lilac river with a rope bridge, the mint tide pool, the beach.
 * Static: drawn once; the map moves it with a single GPU transform.
 */
export const WORLD = { w: 1024, h: 1536 };

const ROCKS: [number, number, number][] = [
  [110, 712, 46], [250, 742, 30], [770, 700, 52], [880, 676, 34], [150, 896, 40], [330, 906, 28], [700, 892, 36], [835, 872, 54],
  [70, 1236, 44], [945, 1112, 40], [905, 1372, 46], [138, 1300, 30], [600, 340, 22], [640, 418, 30], [372, 522, 26], [930, 1440, 30],
];
const PLANTS: [number, number, number][] = [
  [60, 676, 1], [330, 405, 0.8], [740, 470, 0.9], [935, 610, 1.1], [40, 850, 1], [965, 905, 1], [26, 1180, 1.1], [985, 1300, 0.9], [420, 378, 0.6], [880, 760, 0.7], [210, 640, 0.8],
];

function Plant({ x, y, k }: { x: number; y: number; k: number }) {
  const leaves = [-70, -40, -12, 14, 42, 70];
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      {leaves.map((a, i) => (
        <Path key={i} d="M0 0 C-8 -26 -6 -50 0 -64 C6 -50 8 -26 0 0Z" fill={i % 2 ? "#6FAE7E" : "#86C08E"} transform={`rotate(${a})`} />
      ))}
    </G>
  );
}

function Rock({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + r * 0.2} rx={r * 1.15} ry={r * 0.42} fill="#000" opacity={0.06} />
      <Ellipse cx={x} cy={y} rx={r} ry={r * 0.62} fill="#B5A9C4" />
      <Ellipse cx={x - r * 0.18} cy={y - r * 0.18} rx={r * 0.62} ry={r * 0.3} fill="#CEC4DA" />
    </G>
  );
}

export const Island = memo(function Island({ nodes }: { nodes: MapNode[] }) {
  const { w: W, h: H } = WORLD;
  const fires = nodes.filter((n) => n.kind === "fire");
  const stones = nodes.filter((n) => n.kind === "stone");
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <LinearGradient id="iSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDC9B4" />
          <Stop offset="0.6" stopColor="#FBE1C6" />
          <Stop offset="1" stopColor="#EED8E2" />
        </LinearGradient>
        <RadialGradient id="iSun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFF4D6" stopOpacity={1} />
          <Stop offset="0.3" stopColor="#FFE3A8" stopOpacity={0.8} />
          <Stop offset="1" stopColor="#FFD9A0" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="iSea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E3CBDD" />
          <Stop offset="0.25" stopColor="#C2BBE6" />
          <Stop offset="0.7" stopColor="#A9D8DA" />
          <Stop offset="1" stopColor="#8FDACB" />
        </LinearGradient>
        <LinearGradient id="iHill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E3E3A0" />
          <Stop offset="0.5" stopColor="#C6DB95" />
          <Stop offset="1" stopColor="#A9CF8E" />
        </LinearGradient>
        <LinearGradient id="iSand" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5E6C4" />
          <Stop offset="1" stopColor="#F3DDB4" />
        </LinearGradient>
        <LinearGradient id="iRiver" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A497DE" />
          <Stop offset="1" stopColor="#BBB0EA" />
        </LinearGradient>
        <LinearGradient id="iPool" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A7E9DA" />
          <Stop offset="1" stopColor="#7FD7C6" />
        </LinearGradient>
        <RadialGradient id="iMist" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="iGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFB37A" stopOpacity={0.8} />
          <Stop offset="1" stopColor="#FFB37A" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Sky and sun */}
      <Rect x={0} y={0} width={W} height={260} fill="url(#iSky)" />
      <Path d="M215 190 L-80 0 L60 0Z M215 190 L120 0 L240 0Z M215 190 L420 0 L560 0Z" fill="#FFF3DA" opacity={0.28} />
      <Circle cx={215} cy={190} r={200} fill="url(#iSun)" />
      <Circle cx={215} cy={192} r={52} fill="#FFF1C9" />

      {/* Far volcano: Ember Ridge, Level 3 */}
      <Path d="M560 236 C620 170 680 92 712 70 C724 62 736 62 748 70 C780 92 840 170 900 236Z" fill="#D8B9C8" opacity={0.75} />
      <Ellipse cx={730} cy={68} rx={40} ry={26} fill="url(#iGlow)" />
      <Path d="M712 70 C724 62 736 62 748 70 L736 86 L724 80Z" fill="#F2A27E" />

      {/* Sea */}
      <Rect x={0} y={230} width={W} height={H - 230} fill="url(#iSea)" />
      {Array.from({ length: 9 }, (_, i) => (
        <Rect key={i} x={215 - (60 - i * 4)} y={250 + i * 22} width={(60 - i * 4) * 2} height={6} rx={3} fill="#FFE9B8" opacity={0.75 - i * 0.07} />
      ))}

      {/* The Listening Jungle, Level 2: across the water, in mist */}
      <Path d="M290 232 C330 170 400 130 470 112 C540 70 640 60 720 96 C800 110 880 150 950 232Z" fill="#7FAF8B" />
      {[[360, 168, 36], [430, 130, 40], [500, 104, 44], [580, 88, 46], [660, 92, 44], [740, 118, 40], [820, 152, 36], [890, 196, 30]].map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#8DBE98" : "#76A886"} />
      ))}
      <Path d="M560 92 q-4 -40 12 -62 M572 30 q-22 -6 -34 8 M572 30 q20 -10 34 4 M690 98 q-2 -32 12 -50 M702 48 q-18 -4 -28 6 M702 48 q16 -8 28 2" stroke="#5E9672" strokeWidth={5} fill="none" strokeLinecap="round" />
      <Ellipse cx={520} cy={214} rx={300} ry={36} fill="url(#iMist)" />
      <Ellipse cx={820} cy={196} rx={180} ry={30} fill="url(#iMist)" />
      <Ellipse cx={400} cy={150} rx={120} ry={20} fill="url(#iMist)" opacity={0.6} />

      {/* Left islet */}
      <Path d="M-20 450 C10 380 70 330 130 340 C170 346 190 400 200 450Z" fill="#7FAF8B" />
      <Circle cx={60} cy={360} r={34} fill="#8DBE98" />
      <Circle cx={120} cy={352} r={28} fill="#76A886" />
      <Ellipse cx={90} cy={446} rx={160} ry={30} fill="url(#iMist)" />

      {/* The main island: sand */}
      <Path d="M-20 650 C80 600 200 590 300 600 C420 560 620 560 760 600 C860 610 960 600 1044 640 V1440 C900 1425 760 1450 600 1432 C420 1414 220 1450 -20 1430Z" fill="url(#iSand)" />
      {/* Foam and shallow water at the beach */}
      <Path d="M-20 1430 C220 1450 420 1414 600 1432 C760 1450 900 1425 1044 1440" stroke="#FFFFFF" strokeWidth={8} fill="none" opacity={0.85} strokeLinecap="round" />
      <Path d="M-20 1462 C240 1480 460 1446 640 1466 C800 1482 920 1460 1044 1470" stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.5} />

      {/* The Lookout hill */}
      <Path d="M140 668 C240 560 370 400 470 356 C540 326 600 338 660 380 C770 456 880 560 970 668Z" fill="url(#iHill)" />
      <Path d="M300 560 C380 470 450 410 500 390 C440 440 390 500 360 570Z" fill="#F0EBB4" opacity={0.6} />
      <Ellipse cx={515} cy={356} rx={60} ry={16} fill="#EBDDB0" />

      {/* The River Crossing */}
      <Path d="M-20 706 C300 690 700 716 1044 700 V858 C700 874 300 850 -20 866Z" fill="url(#iRiver)" />
      <Path d="M-20 706 C300 690 700 716 1044 700" stroke="#E9E2F6" strokeWidth={4} fill="none" opacity={0.7} />
      {[[90, 760], [240, 820], [680, 750], [860, 820], [330, 740], [760, 840]].map(([x, y], i) => (
        <Path key={i} d={`M${x} ${y} q20 -7 40 0 t40 0`} stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.55} strokeLinecap="round" />
      ))}
      {/* Rope bridge: posts and rails; the planks are the lesson nodes */}
      {[448, 568].map((x) => (
        <G key={x}>
          <Path d={`M${x} 668 C${x + (x < 500 ? -6 : 6)} 740 ${x + (x < 500 ? -6 : 6)} 824 ${x} 896`} stroke="#8B6B4A" strokeWidth={4} fill="none" />
          <Rect x={x - 8} y={650} width={16} height={36} rx={5} fill="#8B6B4A" />
          <Rect x={x - 8} y={880} width={16} height={36} rx={5} fill="#8B6B4A" />
          <Rect x={x - 9} y={646} width={18} height={8} rx={4} fill="#A3845F" />
          <Rect x={x - 9} y={876} width={18} height={8} rx={4} fill="#A3845F" />
        </G>
      ))}

      {/* The Seven Stones: the tide pool */}
      <Path d="M70 1000 C60 950 120 935 300 940 C520 946 800 930 940 960 C1000 980 1012 1100 992 1200 C976 1290 900 1312 640 1312 C380 1312 150 1322 90 1272 C40 1230 60 1120 70 1000Z" fill="url(#iPool)" />
      <Path d="M70 1000 C60 950 120 935 300 940 C520 946 800 930 940 960" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.6} />
      {[[180, 1060, 30], [270, 1150, 22], [820, 1020, 26], [900, 1200, 30], [720, 1260, 22], [330, 1270, 26]].map(([x, y, r], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.5} fill="#6FCAB9" opacity={0.6} />
      ))}
      {stones.map((n) => (
        <G key={n.id}>
          <Ellipse cx={n.x} cy={n.y + 10} rx={92} ry={30} stroke="#FFFFFF" strokeWidth={2.5} fill="none" opacity={0.7} />
          <Ellipse cx={n.x} cy={n.y + 10} rx={70} ry={22} fill="#5FB8A8" opacity={0.25} />
        </G>
      ))}

      {/* Rocks and plants */}
      {ROCKS.map(([x, y, r], i) => (
        <Rock key={i} x={x} y={y} r={r} />
      ))}
      {PLANTS.map(([x, y, k], i) => (
        <Plant key={i} x={x} y={y} k={k} />
      ))}

      {/* Campfire stone rings under the campfire nodes */}
      {fires.map((n) => (
        <G key={n.id}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return <Ellipse key={i} cx={n.x + Math.cos(a) * 52} cy={n.y + 8 + Math.sin(a) * 20} rx={11} ry={7} fill="#A79BB5" />;
          })}
        </G>
      ))}

      {/* The telescope at the top of the hill, pointed at the jungle */}
      <G>
        <Path d="M517 330 l-26 34 M517 330 l26 34 M517 330 l0 38" stroke="#7A5A3A" strokeWidth={5} strokeLinecap="round" />
        <Path d="M470 300 L560 262" stroke="#C9A15A" strokeWidth={18} strokeLinecap="round" />
        <Path d="M540 270 L568 258" stroke="#9C7A3E" strokeWidth={22} strokeLinecap="round" />
        <Circle cx={517} cy={284} r={7} fill="#7A5A3A" />
      </G>
    </Svg>
  );
});
