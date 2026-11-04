import { lessons, type Lesson } from "../content/level1";
import { c } from "../theme";

/**
 * The Middle: ILN's archipelago. Level 1 is Quiet Shore, walked from the beach (bottom)
 * up to the Lookout (top), with the Listening Jungle and the later islands in mist on the horizon.
 * Everything here is plain layout maths, so the map can be drawn once and never re-rendered while scrolling.
 */
export type Kind = "stone" | "plank" | "item" | "fire";
export type MapNode = { id: string; i: number; x: number; y: number; zone: 1 | 2 | 3; kind: Kind; n: number; lesson: Lesson; icon?: Icon };
export type Icon = "map" | "compass" | "lantern" | "fire";
export type Zone = { n: 1 | 2 | 3; name: string; module: string; landmark: string; y: number; top: number; bottom: number; leak: [string, string] };

export const ZONES: Omit<Zone, "y" | "top" | "bottom">[] = [
  { n: 1, name: "The Seven Stones", module: "The 7 Principles", landmark: "Seven stepping stones across a tide pool. Each one lights up as you learn it.", leak: [c.gold, "#F6B79A"] },
  { n: 2, name: "The River Crossing", module: "The Negotiation Timeline", landmark: "A rope bridge that builds itself, plank by plank.", leak: ["#D9C2F0", c.purple] },
  { n: 3, name: "The Lookout", module: "Negotiation Preparation", landmark: "A hill camp. Pack what you need, then look across the water.", leak: [c.mint, "#9FD3F0"] },
];
export const ISLANDS = [
  { level: 2, name: "The Listening Jungle", mood: "Learning to tune in" },
  { level: 3, name: "Ember Ridge", mood: "Handling the heat" },
  { level: 4, name: "The Table", mood: "Where great communicators sit" },
];
/** Each module gives Leon one of the logo colours. */
export const MODULE_COLOUR: Record<number, "gold" | "purple" | "mint"> = { 1: "gold", 2: "purple", 3: "mint" };
export const colourHex = { gold: c.gold, purple: c.purple, mint: c.mint };

const ITEM_ICONS: Icon[] = ["map", "compass", "lantern"];

/** Heights of each band, bottom to top, in px. */
const BEACH = 330;
const GAP = 170; // zone title space
const STEP = [96, 92, 104];

export function layout(W: number) {
  const cx = W / 2;
  const A = Math.min(W * 0.26, 110);
  const nodes: Omit<MapNode, "y">[] = [];
  const us: number[] = [];
  const zones: Zone[] = [];
  let u = BEACH;
  for (const z of ZONES) {
    const ls = lessons.filter((l) => l.module === z.n);
    const bottom = u;
    u += GAP;
    const titleU = u - 60;
    ls.forEach((l, k) => {
      let x = cx;
      let kind: Kind = l.practice ? "fire" : z.n === 1 ? "stone" : z.n === 2 ? "plank" : "item";
      if (z.n === 1) x = cx + A * Math.sin(k * 1.05 + 0.4);
      if (z.n === 2) x = l.practice ? cx + A * 0.75 : cx + (k % 2 ? 6 : -6);
      if (z.n === 3) x = cx + A * 0.85 * Math.sin(k * 1.7 + 2.2);
      const nInZone = ls.filter((q) => !q.practice).indexOf(l) + 1;
      nodes.push({ id: l.id, i: lessons.indexOf(l), x, zone: z.n as 1 | 2 | 3, kind, n: nInZone, lesson: l, icon: kind === "fire" ? "fire" : kind === "item" ? ITEM_ICONS[k % 3] : undefined });
      us.push(u);
      u += STEP[z.n - 1] + (l.practice ? 20 : 0);
    });
    zones.push({ ...z, y: titleU, top: u, bottom });
    u += 10;
  }
  const lookoutU = u + 40; // telescope at the top of the hill
  const H = lookoutU + 680; // horizon and islands, with sky above them for the header
  const flip = (v: number) => H - v;
  return {
    W,
    H,
    nodes: nodes.map((n, k) => ({ ...n, y: flip(us[k]) })) as MapNode[],
    zones: zones.map((z) => ({ ...z, y: flip(z.y), top: flip(z.top), bottom: flip(z.bottom) })),
    start: { x: cx - A * 0.2, y: flip(BEACH - 70) },
    lookout: { x: cx + A * 0.3, y: flip(lookoutU) },
    horizon: flip(lookoutU + 200),
  };
}
export type World = ReturnType<typeof layout>;

/** Points along the S-curve between two nodes (for the dotted path). */
export function dotsBetween(a: { x: number; y: number }, b: { x: number; y: number }, gap = 13) {
  const d = Math.abs(b.y - a.y);
  const c1 = { x: a.x, y: a.y - d * 0.5 };
  const c2 = { x: b.x, y: b.y + d * 0.5 };
  const at = (t: number) => {
    const m = 1 - t;
    return {
      x: m * m * m * a.x + 3 * m * m * t * c1.x + 3 * m * t * t * c2.x + t * t * t * b.x,
      y: m * m * m * a.y + 3 * m * m * t * c1.y + 3 * m * t * t * c2.y + t * t * t * b.y,
    };
  };
  // Rough arc length, then evenly spaced dots. Skip the ends, which sit under the nodes.
  let len = 0;
  let prev = at(0);
  for (let i = 1; i <= 20; i++) {
    const p = at(i / 20);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  const n = Math.max(2, Math.round(len / gap));
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (t < 0.16 || t > 0.84) continue;
    out.push(at(t));
  }
  return out;
}

/** The map follows the local time: dawn, day, dusk and night. */
export type Tod = "dawn" | "day" | "dusk" | "night";
export const todNow = (h = new Date().getHours()): Tod => (h >= 5 && h < 9 ? "dawn" : h < 17 && h >= 9 ? "day" : h >= 17 && h < 20 ? "dusk" : "night");

export type Palette = { tod: Tod; ground: string; sand: string; sand2: string; water: string; water2: string; meadow: string; hill: string; hill2: string; sky: [string, string]; mist: string; ink: string; sub: string; dotOff: string; stone: string; night: boolean };
export const PALETTES: Record<Tod, Palette> = {
  dawn: { tod: "dawn", ground: c.paper, sand: "#F2E3C8", sand2: "#EAD5B2", water: "#CFEDE5", water2: "#B4E2D7", meadow: "#E3EBD6", hill: "#D5E6CF", hill2: "#C3DABD", sky: ["#F9D4C1", "#F6F1E7"], mist: "#FBF2EA", ink: c.navy, sub: "#6B6A80", dotOff: "#D7CCB8", stone: "#E9E1D2", night: false },
  day: { tod: "day", ground: c.paper, sand: "#F1E4CB", sand2: "#E8D6B5", water: "#CDEDE6", water2: "#AEE0D5", meadow: "#E1ECD7", hill: "#D2E7CF", hill2: "#BFDDBB", sky: ["#D5ECEA", "#F6F1E7"], mist: "#F4F4EE", ink: c.navy, sub: "#6B6A80", dotOff: "#D7CCB8", stone: "#E9E1D2", night: false },
  dusk: { tod: "dusk", ground: "#F4ECE4", sand: "#F0DCC6", sand2: "#E6C9AE", water: "#D6DDEB", water2: "#BFC8E2", meadow: "#E4E2D8", hill: "#DCD8DA", hill2: "#CBC3CF", sky: ["#F2C1A4", "#EBDDE9"], mist: "#F6EAF0", ink: c.navy, sub: "#6E6880", dotOff: "#D9C9BD", stone: "#EADFD6", night: false },
  night: { tod: "night", ground: c.navy, sand: "#1B1A52", sand2: "#232262", water: "#13205A", water2: "#18296A", meadow: "#151750", hill: "#1A2258", hill2: "#202A66", sky: ["#05042A", c.navy], mist: "#1D1C55", ink: "#F6F1E7", sub: "#A9A8C9", dotOff: "#2F2E6E", stone: "#29286A", night: true },
};

/**
 * Painted map (ChatGPT art, 1024x1536). Nodes sit on the stones, bridge and camp drawn in the picture.
 * Points are in image pixels, bottom to top, one per lesson in order.
 */
export const ART = { w: 1024, h: 1536, top: "#FDCDB7", bottom: "#78D0C2" };
const ART_PTS: [number, number][] = [
  // The Seven Stones (p1-p7), then the first campfire (x1)
  [475, 1252], [590, 1222], [675, 1166], [583, 1113], [455, 1073], [380, 1025], [462, 976], [498, 905],
  // The River Crossing (t1-t5) up the bridge, then the hill campfire (x2)
  [508, 878], [508, 828], [508, 778], [508, 728], [508, 678], [500, 612],
  // The Lookout: map, compass, lantern (r1-r3), then the top campfire (x3)
  [640, 560], [400, 492], [610, 436], [470, 392],
];
export function layoutArt(W: number) {
  // Zoom in on the path (x 340 to 700 in the picture) so stones are big enough to tap; the sides of the island crop off.
  const s = Math.max(0.75, (W - 40) / 360);
  const artW = ART.w * s, artH = ART.h * s;
  const padTop = 110, padBottom = 250; // room for the header and the bottom card
  const ox = W / 2 - 524 * s, oy = padTop;
  const P = (x: number, y: number) => ({ x: ox + x * s, y: oy + y * s });
  const H = padTop + artH + padBottom;
  const nodes: MapNode[] = lessons.map((l, i) => {
    const z = l.module as 1 | 2 | 3;
    const kind: Kind = l.practice ? "fire" : z === 1 ? "stone" : z === 2 ? "plank" : "item";
    const ls = lessons.filter((q) => q.module === z && !q.practice);
    return { id: l.id, i, ...P(...ART_PTS[i]), zone: z, kind, n: ls.indexOf(l) + 1, lesson: l, icon: kind === "fire" ? "fire" : kind === "item" ? ITEM_ICONS[ls.indexOf(l) % 3] : undefined };
  });
  const zy = (y: number) => oy + y * s;
  const zones: Zone[] = ZONES.map((z, k) => ({ ...z, y: zy([1330, 930, 560][k]), right: k === 1, top: zy([960, 650, 380][k]), bottom: zy([1300, 880, 650][k]) }));
  return { W, H, s, art: { x: ox, y: oy, w: artW, h: artH }, nodes, zones, start: P(490, 1330), lookout: P(517, 335), horizon: zy(220) };
}
export type ArtWorld = ReturnType<typeof layoutArt>;

/** The drawn, movable island: lesson nodes in world units (1024 x 1536), on the places drawn in Island.tsx. */
export function layoutIsland() {
  const nodes: MapNode[] = lessons.map((l, i) => {
    const z = l.module as 1 | 2 | 3;
    const kind: Kind = l.practice ? "fire" : z === 1 ? "stone" : z === 2 ? "plank" : "item";
    const ls = lessons.filter((q) => q.module === z && !q.practice);
    const [x, y] = ART_PTS[i];
    return { id: l.id, i, x, y, zone: z, kind, n: ls.indexOf(l) + 1, lesson: l, icon: kind === "fire" ? "fire" : kind === "item" ? ITEM_ICONS[ls.indexOf(l) % 3] : undefined };
  });
  // Zone tags: [x, y, anchor right?]
  const tags: { n: 1 | 2 | 3; x: number; y: number }[] = [
    { n: 1, x: 70, y: 1340 },
    { n: 2, x: 640, y: 900 },
    { n: 3, x: 90, y: 560 },
  ];
  return { W: 1024, H: 1536, nodes, tags, start: { x: 490, y: 1380 }, lookout: { x: 517, y: 360 }, horizon: 230, zones: [] as Zone[] };
}
