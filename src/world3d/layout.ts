import { CatmullRomCurve3, Vector3 } from "three";

/**
 * Quiet Shore in 3D: plain layout maths shared by the scene, the camera rail and the picking.
 * Units are metres. x runs right, y up, and the path climbs away from the camera along -z.
 * The sea lies on the left; dunes rise on the right; the headland at the end overlooks the water.
 */

export type StopKind = "stone" | "plank" | "item" | "fire";
export type Stop = { id: string; kind: StopKind; module: 1 | 2 | 3; pos: Vector3; /** where Leon stands */ foot: Vector3; item?: "map" | "compass" | "lantern" };

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Small value noise, deterministic, so the ground is the same on every device.
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return mix(mix(a, b, u), mix(c, d, u), v);
}
export function fbm(x: number, y: number, o = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) {
    s += a * noise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

/** Where the sea meets the sand, as x for a given z. */
export const coastX = (z: number) => -7.5 + 1.6 * Math.sin(z * 0.085) + 0.8 * Math.sin(z * 0.23 + 1.3) + sstep(-34, -46, z) * 2.2;
/** The river's centre line, as z for a given x. */
export const riverZ = (x: number) => -30 + 1.1 * Math.sin(x * 0.11 + 0.4);
export const POOL = { x: 0.6, z: -10, rx: 5.6, rz: 7.8 };
export const RIVER_HALF = 2.7;
export const HEAD = { z0: -35, z1: -56, top: 4.8 };
export const GATE_Z = -62;
export const SEA_Y = 0;

/** Ground height. Everything below SEA_Y is under water (sea, tide pool, river). */
export function height(x: number, z: number) {
  const d = x - coastX(z);
  const head = sstep(HEAD.z0, HEAD.z1, z);
  // The beach shelves gently into the sea; at the headland it becomes a cliff.
  const shelf = mix(sstep(-5, 7, d), sstep(-1.2, 2.2, d), head);
  let h = mix(-2.6, 0.55, shelf);
  // A soft rise of dunes on the right.
  h += sstep(7, 24, x) * (2.2 + 1.6 * fbm(x * 0.06, z * 0.06)) * (1 - head * 0.5);
  // Gentle sand waves everywhere on land.
  h += (fbm(x * 0.12 + 3.1, z * 0.12) - 0.5) * 0.5 * shelf;
  // The tide pool, a shallow bowl on the beach.
  const ex = (x - POOL.x) / POOL.rx, ez = (z - POOL.z) / POOL.rz;
  const e = Math.sqrt(ex * ex + ez * ez) + (fbm(x * 0.4, z * 0.4) - 0.5) * 0.12;
  h = mix(h, -0.42 - 0.12 * (1 - e), 1 - sstep(0.78, 1.04, e));
  // The river, cut from the dunes to the sea.
  const rz = Math.abs(z - riverZ(x));
  const r = 1 - sstep(RIVER_HALF * 0.55, RIVER_HALF * 1.35, rz);
  h = mix(h, -0.95, r * sstep(-12, -6, d) * (1 - sstep(30, 46, x)));
  // The headland: a grassy hill rising from the far bank, steep to the sea on the left.
  const lat = 1 - sstep(9, 30, Math.abs(x - 3)) * 0.55;
  const hill = head * HEAD.top * lat * (1 - sstep(GATE_Z - 1, GATE_Z - 8, z)) * sstep(-1.5, 3.5, d);
  h += hill + (fbm(x * 0.2, z * 0.2) - 0.5) * 0.7 * head;
  // Past the gate the land falls away to the water (Level 2 is reached across it).
  const end = sstep(GATE_Z - 3, GATE_Z - 12, z);
  h = mix(h, -3, end);
  return h;
}

/** Where the path runs on the ground (flattened a little under the path). */
export function groundAt(x: number, z: number) {
  return height(x, z);
}

// ---- stops, bottom to top ----
const STONES: [number, number][] = [
  [0.3, -4.4], [2.3, -6.2], [2.9, -8.4], [1.0, -10.2], [-1.4, -11.8], [-1.0, -14.0], [1.1, -15.8],
];
export const BRIDGE = { x: 0.9, z0: -26.4, z1: -33.8, deck: 0.82, sag: 0.22, width: 1.55 };
const bridgeZ = (k: number) => mix(BRIDGE.z0 + 0.74, BRIDGE.z1 - 0.74, k / 4);
export const deckY = (z: number) => {
  const t = (z - BRIDGE.z0) / (BRIDGE.z1 - BRIDGE.z0);
  return BRIDGE.deck - Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * BRIDGE.sag;
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const TELESCOPE = v(-1.9, 0, -57.4);
export const GATE = v(0.6, 0, GATE_Z);

export function stops(ids: { id: string; module: number; practice?: boolean }[]): Stop[] {
  const out: Stop[] = [];
  let s = 0, p = 0, r = 0;
  for (const l of ids) {
    const m = l.module as 1 | 2 | 3;
    if (l.practice) {
      const at = m === 1 ? [1.6, -19.6] : m === 2 ? [2.0, -37.4] : [1.4, -54.2];
      const g = groundAt(at[0], at[1]);
      out.push({ id: l.id, kind: "fire", module: m, pos: v(at[0], g, at[1]), foot: v(at[0] - 1.05, groundAt(at[0] - 1.05, at[1] + 0.5), at[1] + 0.5) });
    } else if (m === 1) {
      const [x, z] = STONES[s++];
      out.push({ id: l.id, kind: "stone", module: 1, pos: v(x, 0.16, z), foot: v(x, 0.2, z) });
    } else if (m === 2) {
      const z = bridgeZ(p++);
      const y = deckY(z);
      out.push({ id: l.id, kind: "plank", module: 2, pos: v(BRIDGE.x, y, z), foot: v(BRIDGE.x, y + 0.06, z) });
    } else {
      const at = [[-1.7, -42.2], [2.6, -46.2], [-0.9, -50.2]][r];
      const item = (["map", "compass", "lantern"] as const)[r++];
      const g = groundAt(at[0], at[1]);
      out.push({ id: l.id, kind: "item", module: 3, item, pos: v(at[0], g, at[1]), foot: v(at[0] + (at[0] < 0 ? 1.2 : -1.2), groundAt(at[0] + (at[0] < 0 ? 1.2 : -1.2), at[1] + 0.3), at[1] + 0.3) });
    }
  }
  return out;
}

/** The walking line: beach start, every stop's foot, the telescope, the gate. */
export function pathCurve(st: Stop[]) {
  const pts = [v(-0.4, groundAt(-0.4, 0.8), 0.8), v(0.1, groundAt(0.1, -1.8), -1.8), ...st.map((q) => q.foot.clone())];
  // between the fire and the bridge, and off the bridge onto the hill, walk on the sand
  const out: Vector3[] = [];
  for (const p of pts) out.push(p);
  out.splice(pts.length, 0);
  const end = v(TELESCOPE.x + 1.6, groundAt(TELESCOPE.x + 1.6, TELESCOPE.z + 0.4), TELESCOPE.z + 0.4);
  out.push(end, v(GATE.x, groundAt(GATE.x, GATE.z + 1.4), GATE.z + 1.4));
  // insert bank points around the bridge so the path does not cut the river
  const i0 = out.findIndex((p) => p.z < BRIDGE.z0 + 0.1);
  if (i0 > 0) out.splice(i0, 0, v(BRIDGE.x, deckY(BRIDGE.z0) + 0.02, BRIDGE.z0 + 0.2));
  const i1 = out.findIndex((p) => p.z < BRIDGE.z1 - 0.1);
  if (i1 > 0) out.splice(i1, 0, v(BRIDGE.x, deckY(BRIDGE.z1) + 0.02, BRIDGE.z1 - 0.2));
  const c = new CatmullRomCurve3(out, false, "centripetal", 0.5);
  return c;
}

/** Leon's spot when the level is done: beside the telescope. */
export const endSpot = () => v(TELESCOPE.x + 1.3, groundAt(TELESCOPE.x + 1.3, TELESCOPE.z + 0.6), TELESCOPE.z + 0.6);
