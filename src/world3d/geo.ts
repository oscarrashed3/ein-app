import { BufferAttribute, BufferGeometry, Color, Euler, Float32BufferAttribute, IcosahedronGeometry, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { noise } from "./layout";

/** Paint a geometry one colour (sRGB hex) and mark how much of it glows. Returns a non-indexed copy ready to merge. */
export function paint(g: BufferGeometry, hex: string, emit = 0, jitter = 0) {
  const geo = g.index ? g.toNonIndexed() : g;
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  const em = new Float32Array(n).fill(emit);
  const c = new Color(hex);
  const pos = geo.attributes.position;
  for (let i = 0; i < n; i++) {
    const k = jitter ? 1 + (noise(pos.getX(i) * 3.1 + 7, pos.getY(i) * 2.7 + pos.getZ(i) * 3.3) - 0.5) * jitter : 1;
    col[i * 3] = c.r * k;
    col[i * 3 + 1] = c.g * k;
    col[i * 3 + 2] = c.b * k;
  }
  geo.setAttribute("color", new BufferAttribute(col, 3));
  geo.setAttribute("aEmit", new BufferAttribute(em, 1));
  if (!geo.attributes.uv) geo.setAttribute("uv", new Float32BufferAttribute(new Float32Array(n * 2), 2));
  return geo;
}

const m4 = new Matrix4(), q = new Quaternion(), e3 = new Vector3();
/** Place a geometry: position, rotation (euler xyz in radians), scale. */
export function put(g: BufferGeometry, p: [number, number, number], r: [number, number, number] = [0, 0, 0], s: number | [number, number, number] = 1) {
  const sc = typeof s === "number" ? new Vector3(s, s, s) : new Vector3(...s);
  q.setFromEuler(new Euler(...r));
  m4.compose(e3.set(...p), q, sc);
  return g.clone().applyMatrix4(m4);
}

export function merge(gs: BufferGeometry[]) {
  const clean = gs.map((g) => {
    const x = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(x.attributes)) if (!["position", "normal", "color", "aEmit", "uv"].includes(k)) x.deleteAttribute(k);
    return x;
  });
  const m = mergeGeometries(clean, false);
  if (!m) throw new Error("merge failed");
  return m;
}

/** A rock: an icosahedron pushed about by noise, faceted. */
export function rockGeo(seed = 0, detail = 1) {
  const g = new IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 0.78 + noise(x * 1.7 + seed, z * 1.7 + y * 1.3 + seed * 3) * 0.45;
    p.setXYZ(i, x * k, y * k * 0.72, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** A tuft of grass blades, base at the origin. */
export function tuftGeo(blades = 7, h = 0.55) {
  const pos: number[] = [], col: number[] = [], em: number[] = [];
  const base = new Color("#4E6238"), tip = new Color("#BDC07A");
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2 + b * 0.7;
    const r = 0.06 + (b % 3) * 0.05;
    const bx = Math.cos(a) * r, bz = Math.sin(a) * r;
    const lean = 0.18 + (b % 2) * 0.12;
    const hh = h * (0.65 + ((b * 37) % 10) / 22);
    const w = 0.035;
    const px = -Math.sin(a) * w, pz = Math.cos(a) * w;
    const tx = bx + Math.cos(a) * lean, tz = bz + Math.sin(a) * lean;
    pos.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, tx, hh, tz);
    col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
    em.push(0, 0, 0);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setAttribute("aEmit", new Float32BufferAttribute(em, 1));
  g.computeVertexNormals();
  // grass reads better lit from above
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, n.getX(i) * 0.3, 0.95, n.getZ(i) * 0.3);
  return g;
}
