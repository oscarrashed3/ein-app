import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  LinearFilter,
  Matrix4,
  Mesh,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Quaternion,
  RGBAFormat,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  UnsignedByteType,
  UnsignedIntType,
  DepthTexture,
  WebGLRenderTarget,
  WebGLRenderer,
  OrthographicCamera,
  MeshBasicMaterial,
  Vector2,
  Vector3,
  Euler,
} from "three";
import { BRIDGE, GATE, GATE_Z, POOL, TELESCOPE, coastX, deckY, endSpot, fbm, groundAt, height, noise, pathCurve, riverZ, stops, type Stop } from "./layout";
import { LIGHTS, applyLight, makeShared, type Shared, type Tod } from "./palette";
import { COMMON, beaconMaterial, birdMaterial, clothMaterial, farMaterial, flameMaterial, mistMaterial, moteMaterial, propMaterial, rayMaterial, ringMaterial, skyMaterial, terrainMaterial, waterMaterial } from "./shaders";
import { merge, paint, put, rockGeo, tuftGeo } from "./geo";

export type StopState = "done" | "next" | "locked";
export type LessonRef = { id: string; module: number; practice?: boolean };
const MOD: Record<number, string> = { 1: "#E4AE36", 2: "#AE36E4", 3: "#36E4AD" };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The Journey world. Plain three.js: it owns a scene and a camera and is driven by whoever renders
 * it (react-three-fiber on web and native, or a bare test page). React talks to it through a few
 * methods: setTod, setProgress, focus, hop, drag/fling, pick, and leonScreen for the overlay.
 */
export class World {
  scene = new Scene();
  camera = new PerspectiveCamera(50, 1, 0.1, 1200);
  u: Shared = makeShared();
  stops: Stop[];
  curve: CatmullRomCurve3;
  len: number;
  private stopT: number[] = [];
  private states: Record<string, StopState> = {};
  private lit: Record<string, number> = {}; // animated light per stop
  private litTo: Record<string, number> = {};
  private pop: Record<string, number> = {};
  private s = 0; // camera distance along the path
  private sTo = 0;
  private vel = 0;
  private dragging = false;
  private leonT = 0; // where Leon stands, curve param 0..1
  private leonPos = new Vector3();
  private hopState: null | { a: Vector3; b: Vector3; tA: number; tB: number; t0: number; dur: number; n: number; done?: () => void } = null;
  private time = 0;
  private reduce = false;
  private size = new Vector2(390, 844);
  private dotSeg: number[] = []; // which path segment each footprint belongs to
  private segLit: number[] = [];
  private segTo: number[] = [];
  private segCol: string[] = [];
  private dots!: InstancedMesh;
  private stonesMesh!: InstancedMesh;
  private planks!: InstancedMesh;
  private ghost!: InstancedMesh;
  private flames!: InstancedMesh;
  private items: Record<string, InstancedMesh> = {};
  private beacon!: Mesh;
  private ring!: Mesh;
  private rays!: Group;
  private birds!: Mesh;
  private flies!: Points;
  private fires: Stop[] = [];
  private gateGlow = 0;
  levelDone = false;
  tod: Tod = "dawn";

  constructor(lessons: LessonRef[]) {
    this.stops = stops(lessons);
    this.curve = pathCurve(this.stops);
    this.len = this.curve.getLength();
    this.stopT = this.stops.map((q) => this.nearestT(q.foot));
    for (const q of this.stops) {
      this.lit[q.id] = 0;
      this.litTo[q.id] = 0;
    }
    this.build();
    this.setTod("dawn");
  }

  // ------------------------------------------------------------ public API
  setTod(t: Tod) {
    this.tod = t;
    applyLight(this.u, LIGHTS[t]);
    const L = LIGHTS[t];
    (this.terrainMat.uniforms.uSand.value as Color).set(L.sand);
    (this.terrainMat.uniforms.uSandShade.value as Color).set(L.sandShade);
    (this.terrainMat.uniforms.uGrass.value as Color).set(L.grass);
    (this.terrainMat.uniforms.uRock.value as Color).set(L.rock);
    (this.waterMat.uniforms.uDeep.value as Color).set(L.waterDeep);
    (this.waterMat.uniforms.uShallow.value as Color).set(L.waterShallow);
    if (this.birds) this.birds.visible = t !== "night";
    this.exposure = L.exposure;
  }
  exposure = 1;
  dpr = 1;
  rig = { x: 1.2, y: 4.0, z: 11.5, frac: 0.07, fo: 0 };
  setReduced(r: boolean) {
    this.reduce = r;
  }
  setSize(w: number, h: number) {
    this.size.set(w, h);
    this.camera.aspect = w / h;
    // Portrait phones get a slightly wider lens so the path never feels cramped.
    this.camera.fov = w / h < 0.6 ? 58 : 48;
    // Leon sits in the clear band between the header and the bottom card, whatever the phone's height.
    this.rig.frac = Math.min(1, Math.max(0, (h - 600) / 220)) * 0.13 - 0.06;
    this.camera.updateProjectionMatrix();
    const ppm = h / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
    (this.flies.material as ShaderMaterial).uniforms.uPx.value = ppm * this.dpr;
    for (const p of this.pointMats) p.uniforms.uPx.value = ppm * this.dpr;
  }
  /** States per stop; walked per path segment (index = stop index; one extra for the end); colour per segment. */
  setProgress(states: Record<string, StopState>, walked: boolean[], levelDone: boolean, popId?: string, hideSeg?: number) {
    this.states = states;
    this.levelDone = levelDone;
    for (const q of this.stops) {
      const st = states[q.id] ?? "locked";
      this.litTo[q.id] = st === "done" ? 1 : st === "next" ? 0.75 : 0;
      if (popId === q.id) {
        this.lit[q.id] = 0;
        this.pop[q.id] = this.time + 0.35;
      } else if (this.lit[q.id] === undefined || !this.started) this.lit[q.id] = this.litTo[q.id];
    }
    this.segTo = walked.map((w, i) => (w && i !== hideSeg ? 1 : 0));
    if (!this.started) this.segLit = [...this.segTo];
    this.started = true;
  }
  private started = false;
  /** Light the segment that was hidden during a hop. */
  fillSeg(i: number) {
    this.segTo[i] = 1;
  }

  tOf(id: string | "end") {
    if (id === "end") return this.nearestT(endSpot());
    const k = this.stops.findIndex((q) => q.id === id);
    return k < 0 ? 0 : this.stopT[k];
  }
  footOf(id: string | "end") {
    if (id === "end") return endSpot();
    return this.stops.find((q) => q.id === id)?.foot.clone() ?? endSpot();
  }
  /** Put Leon on a stop and point the camera at him. */
  place(id: string | "end", animated = false) {
    this.leonPos.copy(this.footOf(id));
    this.leonT = this.tOf(id);
    this.focusT(this.leonT, animated);
  }
  focusT(t: number, animated = true) {
    this.sTo = clamp(t * this.len + this.rig.fo, 0, this.sMax);
    this.vel = 0;
    if (!animated || this.reduce) this.s = this.sTo;
  }
  focusLeon(animated = true) {
    this.focusT(this.leonT, animated);
  }
  /** Leon hops along the path from one stop to the next; the camera glides with him. */
  hop(from: string | "end", to: string | "end", done?: () => void) {
    const a = this.footOf(from), b = this.footOf(to);
    const tA = this.tOf(from), tB = this.tOf(to);
    const dist = Math.abs(tB - tA) * this.len;
    const n = Math.max(1, Math.round(dist / 2.4));
    this.leonPos.copy(a);
    this.leonT = tA;
    this.hopState = { a, b, tA, tB, t0: this.time, dur: 0.42 * n + 0.2, n, done };
  }
  /** The camera stops short of the gate, so it always stands in view at the end of the land. */
  get sMax() {
    return this.len - 7;
  }
  get hopping() {
    return !!this.hopState;
  }

  // drag: pixels; positive dy = finger moves down = walk back toward the beach
  dragStart() {
    this.dragging = true;
    this.vel = 0;
  }
  dragBy(dy: number) {
    const k = this.metresPerPx();
    this.sTo = clamp(this.sTo + dy * k, -1.5, this.sMax + 1.5);
    this.s = this.sTo;
  }
  dragEnd(vy: number) {
    this.dragging = false;
    this.vel = this.reduce ? 0 : vy * this.metresPerPx() * 1000;
  }
  wheel(dy: number) {
    this.sTo = clamp(this.sTo - dy * this.metresPerPx() * 0.8, 0, this.sMax);
  }
  private metresPerPx() {
    return 26 / this.size.y;
  }

  /** The stop under a tap, if any (screen px). */
  pick(x: number, y: number): string | null {
    let best: string | null = null, bd = 56;
    const v = new Vector3();
    for (const q of this.stops) {
      v.copy(q.pos).add(new Vector3(0, q.kind === "fire" ? 0.4 : q.kind === "item" ? 0.6 : 0.1, 0)).project(this.camera);
      if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * this.size.x, sy = (-v.y * 0.5 + 0.5) * this.size.y;
      const d = Math.hypot(sx - x, sy - y);
      if (d < bd) {
        bd = d;
        best = q.id;
      }
    }
    return best;
  }
  /** Where Leon's feet are on screen and how big he should be (px per metre). */
  leonScreen() {
    return this.screenOf(this.leonPos);
  }
  gateScreen() {
    return this.screenOf(new Vector3(GATE.x, groundAt(GATE.x, GATE.z) + 3.2, GATE.z));
  }
  screenOf(p: Vector3) {
    const v = p.clone().project(this.camera);
    const d = p.distanceTo(this.camera.position);
    const ppm = this.size.y / 2 / Math.tan(((this.camera.fov / 2) * Math.PI) / 180) / Math.max(0.1, d);
    return { x: (v.x * 0.5 + 0.5) * this.size.x, y: (-v.y * 0.5 + 0.5) * this.size.y, ppm, visible: v.z < 1 && v.z > -1 };
  }

  // ------------------------------------------------------------ frame
  update(dt: number) {
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    const t = this.time;
    this.u.uTime.value = this.reduce ? t * 0.35 : t;

    // camera rail with momentum
    if (!this.dragging) {
      if (Math.abs(this.vel) > 0.01) {
        this.sTo = clamp(this.sTo + this.vel * dt, 0, this.sMax);
        this.vel *= Math.pow(0.04, dt);
        if (this.sTo <= 0 || this.sTo >= this.sMax) this.vel = 0;
      }
      this.sTo = clamp(this.sTo, 0, this.sMax);
      this.s += (this.sTo - this.s) * (1 - Math.pow(0.0025, dt));
    }

    // Leon's hop
    if (this.hopState) {
      const h = this.hopState;
      const k = clamp((t - h.t0) / h.dur);
      const e = easeIO(k);
      const tt = h.tA + (h.tB - h.tA) * e;
      const p = this.curve.getPointAt(clamp(tt));
      // blend the ends onto the exact stop spots
      const w0 = 1 - sstep(0, 0.15, e), w1 = sstep(0.85, 1, e);
      p.lerp(h.a, w0).lerp(h.b, w1);
      const hopK = Math.abs(Math.sin(Math.PI * k * h.n));
      p.y += hopK * 0.55;
      this.leonPos.copy(p);
      this.leonT = tt;
      if (!this.dragging) this.sTo = clamp(tt * this.len + this.rig.fo, 0, this.sMax);
      if (k >= 1) {
        this.leonPos.copy(h.b);
        this.leonT = h.tB;
        const d = h.done;
        this.hopState = null;
        d?.();
      }
    }

    this.placeCamera();
    this.animateStops(dt);
    this.animateLife(dt);
  }

  private placeCamera() {
    const L = this.len;
    const s = clamp(this.s, -1.5, L + 1.5);
    const at = (d: number) => this.curve.getPointAt(clamp((s + d) / L));
    const p = at(0), ahead = at(10), back = at(-4);
    const x = (p.x + ahead.x + back.x) / 3;
    const R = this.rig;
    // Low and behind, like a walking camera; the land and sea fill the frame, the sky opens above.
    const camPos = new Vector3(p.x * 0.75 + x * 0.25 + R.x * 0.3, Math.max(p.y, back.y * 0.5 + p.y * 0.5) + R.y + Math.max(0, ahead.y - p.y) * 0.45, p.z + R.z);
    // Pitch so the point on the path sits a little below the middle of the screen.
    const dy = camPos.y - p.y, dz = camPos.z - p.z;
    const half = (this.camera.fov * Math.PI) / 360;
    const pitch = Math.atan2(dy, dz) - Math.atan(R.frac * Math.tan(half)) - (ahead.y - p.y) * 0.012;
    const hx = p.x + (ahead.x - p.x) * 0.2 - camPos.x, hz = ahead.z - camPos.z;
    const hl = Math.hypot(hx, hz);
    const dir = new Vector3((hx / hl) * Math.cos(pitch), -Math.sin(pitch), (hz / hl) * Math.cos(pitch));
    this.camera.position.copy(camPos);
    this.camera.lookAt(camPos.clone().add(dir));
    this.u.uCam.value.copy(camPos);
    this.rays.position.set(camPos.x, 0, camPos.z);
  }

  private animateStops(dt: number) {
    const t = this.time;
    const m = new Matrix4(), q = new Quaternion(), sc = new Vector3(), pos = new Vector3();
    // stones
    const sA = this.stonesMesh.geometry.getAttribute("aState") as InstancedBufferAttribute;
    const pA = this.planks.geometry; // wood planks shown only when done
    let si = 0, pi = 0, fi = 0;
    const gA = this.ghost.geometry.getAttribute("aState") as InstancedBufferAttribute;
    const fA = this.flames.geometry.getAttribute("aState") as InstancedBufferAttribute;
    let next: Stop | null = null;
    for (const s of this.stops) {
      const to = this.litTo[s.id];
      let l = this.lit[s.id];
      const popAt = this.pop[s.id];
      if (popAt !== undefined && t < popAt) l = 0;
      else l += (to - l) * (1 - Math.pow(0.02, dt));
      this.lit[s.id] = l;
      const st = this.states[s.id] ?? "locked";
      if (st === "next") next = s;
      const flash = popAt !== undefined ? Math.max(0, 1 - Math.abs(t - popAt - 0.25) * 2.2) : 0;
      if (s.kind === "stone") {
        sA.setXYZ(si, Math.min(1.6, l + flash), st === "next" ? 1 : 0, 0);
        si++;
      } else if (s.kind === "plank") {
        const built = st === "done";
        for (let k = 0; k < 4; k++) {
          const i = pi * 4 + k;
          this.plankBase[i].decompose(pos, q, sc);
          // planks drop into place when their section is learned
          const grow = built ? clamp(l * 1.25) : 0;
          sc.setScalar(grow < 0.01 ? 0 : 1);
          pos.y += (1 - easeOut(grow)) * 0.6;
          m.compose(pos, q, sc);
          this.planks.setMatrixAt(i, m);
          gA.setXYZ(i, built ? 0 : st === "next" ? 0.75 + 0.25 * Math.sin(t * 2.6) : 0.12, 0, 0);
        }
        pi++;
      } else if (s.kind === "fire") {
        fA.setXYZ(fi, st === "done" ? clamp(l) + flash : st === "next" ? 0.35 + 0.1 * Math.sin(t * 3) : 0, fi * 0.37, 0);
        // warm light on the ground around the fire
        const k = st === "done" ? clamp(l) : st === "next" ? 0.35 : 0;
        const flick = 0.85 + 0.15 * Math.sin(t * 11 + fi) * Math.sin(t * 7.3 + fi * 2);
        this.u.uLR.value[fi] = 5.5;
        this.u.uLC.value[fi].set("#FF9A3C").multiplyScalar(k * flick * 1.4);
        fi++;
      } else if (s.kind === "item") {
        const mesh = this.items[s.id];
        const a = mesh.geometry.getAttribute("aState") as InstancedBufferAttribute;
        a.setXYZ(0, Math.min(1.6, l + flash), st === "next" ? 1 : 0, 0);
        a.needsUpdate = true;
        if (s.item === "lantern") {
          this.u.uLR.value[3] = 4.5;
          this.u.uLC.value[3].set("#36E4AD").multiplyScalar(l * 0.9);
        }
      }
    }
    sA.needsUpdate = true;
    gA.needsUpdate = true;
    fA.needsUpdate = true;
    this.planks.instanceMatrix.needsUpdate = true;
    void pA;

    // the next stop: a column of light in its module's colour
    if (next && !this.hopState) {
      const col = new Color(MOD[next.module]);
      (this.beacon.material as ShaderMaterial).uniforms.uCol.value = col;
      (this.ring.material as ShaderMaterial).uniforms.uCol.value = col;
      const base = next.kind === "fire" ? next.pos : next.foot;
      this.beacon.position.set(base.x, base.y, base.z);
      this.ring.position.set(base.x, base.y + 0.03, base.z);
      this.beacon.visible = this.ring.visible = true;
      const k = (this.beacon.material as ShaderMaterial).uniforms.uK;
      k.value += (1 - k.value) * (1 - Math.pow(0.05, dt));
    } else {
      const k = (this.beacon.material as ShaderMaterial).uniforms.uK;
      k.value *= Math.pow(0.002, dt);
      (this.ring.material as ShaderMaterial).uniforms.uK.value = k.value;
      if (k.value < 0.01) this.beacon.visible = this.ring.visible = false;
    }
    (this.ring.material as ShaderMaterial).uniforms.uK.value = (this.beacon.material as ShaderMaterial).uniforms.uK.value;

    // footprints: walked segments glow in the module's colour
    const dA = this.dots.geometry.getAttribute("aState") as InstancedBufferAttribute;
    for (let i = 0; i < this.segLit.length; i++) this.segLit[i] += ((this.segTo[i] ?? 0) - this.segLit[i]) * (1 - Math.pow(0.03, dt));
    for (let i = 0; i < this.dotSeg.length; i++) {
      const sg = this.dotSeg[i];
      dA.setXYZ(i, (this.segLit[sg] ?? 0) * 0.8, 0, 0);
    }
    dA.needsUpdate = true;

    // the gate glows once the level is done
    this.gateGlow += ((this.levelDone ? 1 : 0.25) - this.gateGlow) * (1 - Math.pow(0.1, dt));
    const gA2 = this.gateMesh.geometry.getAttribute("aState") as InstancedBufferAttribute;
    gA2.setXYZ(0, this.gateGlow, this.levelDone ? 0 : 1, 0);
    gA2.needsUpdate = true;
    this.u.uLR.value[4] = 7;
    this.u.uLC.value[4].set("#E4AE36").multiplyScalar(this.gateGlow * 0.8);
  }

  private animateLife(dt: number) {
    void dt;
  }

  // ------------------------------------------------------------ build
  private terrainMat!: ShaderMaterial;
  private waterMat!: ShaderMaterial;
  private plankBase: Matrix4[] = [];
  private gateMesh!: InstancedMesh;
  private pointMats: ShaderMaterial[] = [];

  /** Mark an object as casting a shadow (drawn in the sun's depth pass). */
  private cast<T extends Object3D>(o: T): T {
    o.layers.enable(1);
    return o;
  }
  shadowRT: WebGLRenderTarget | null = null;
  private shadowCam = new OrthographicCamera(-26, 26, 26, -26, 1, 160);
  private depthMat = new MeshBasicMaterial({ colorWrite: false });
  /** The sun's depth pass: long soft shadows from rocks, posts, stones and the hill itself. Call before the main render. */
  renderShadow(gl: WebGLRenderer) {
    if (!this.shadowRT) {
      const size = this.shadowSize;
      const dt = new DepthTexture(size, size);
      dt.type = UnsignedIntType;
      this.shadowRT = new WebGLRenderTarget(size, size, { depthTexture: dt, depthBuffer: true });
      this.u.uShadowMap.value = dt;
    }
    const focus = this.curve.getPointAt(clamp((this.s + 8) / this.len));
    const d = this.u.uSunDir.value;
    const sc = this.shadowCam;
    sc.position.copy(focus).addScaledVector(d, 70);
    sc.up.set(0, 1, 0);
    sc.lookAt(focus);
    sc.updateMatrixWorld();
    sc.layers.set(1);
    this.u.uShadowMat.value.multiplyMatrices(sc.projectionMatrix, sc.matrixWorldInverse);
    const prevOverride = this.scene.overrideMaterial;
    const prevRT = gl.getRenderTarget();
    this.scene.overrideMaterial = this.depthMat;
    gl.setRenderTarget(this.shadowRT);
    gl.clear(true, true, false);
    gl.render(this.scene, sc);
    gl.setRenderTarget(prevRT);
    this.scene.overrideMaterial = prevOverride;
    this.u.uShadowOn.value = 1;
  }
  shadowSize = 2048;

  private nearestT(p: Vector3) {
    let best = 0, bd = 1e9;
    for (let i = 0; i <= 600; i++) {
      const t = i / 600;
      const d = this.curve.getPointAt(t).distanceToSquared(p);
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  }

  private build() {
    const sc = this.scene;
    const u = this.u;

    // sky
    const sky = new Mesh(new SphereGeometry(900, 48, 24), skyMaterial(u));
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    sc.add(sky);

    this.buildTerrain();
    this.buildWater();
    this.buildStones();
    this.buildBridge();
    this.buildCamp();
    this.buildPath();
    this.buildGate();
    this.buildScatter();
    this.buildCloth();
    this.buildFar();
    this.buildLife();

    // the next-stop marker
    const bm = beaconMaterial(u);
    bm.uniforms.uCol.value = new Color(MOD[1]);
    const bg = new PlaneGeometry(1, 1);
    bg.translate(0, 0.5, 0);
    this.beacon = new Mesh(bg, bm);
    this.beacon.scale.set(1.1, 8, 1);
    this.beacon.frustumCulled = false;
    this.beacon.renderOrder = 5;
    sc.add(this.beacon);
    const rm = ringMaterial(u);
    rm.uniforms.uCol.value = new Color(MOD[1]);
    const rg = new PlaneGeometry(3.2, 3.2);
    rg.rotateX(-Math.PI / 2);
    this.ring = new Mesh(rg, rm);
    this.ring.renderOrder = 4;
    sc.add(this.ring);
  }

  private buildTerrain() {
    // A grid that is fine near the path and coarse far away, so the land reaches the horizon cheaply.
    const lines = (c0: number, c1: number, step: number, grow: number, min: number, max: number) => {
      const a: number[] = [];
      for (let v = c0; v <= c1; v += step) a.push(v);
      let s = step, v = c1;
      while (v < max) {
        s *= grow;
        v += s;
        a.push(Math.min(v, max));
      }
      s = step;
      v = c0;
      const lo: number[] = [];
      while (v > min) {
        s *= grow;
        v -= s;
        lo.push(Math.max(v, min));
      }
      return [...lo.reverse(), ...a];
    };
    const xs = lines(-12, 22, 0.5, 1.07, -260, 360);
    const zs = lines(-72, 12, 0.5, 1.07, -520, 80);
    const nx = xs.length, nz = zs.length;
    const pos = new Float32Array(nx * nz * 3);
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const k = (j * nx + i) * 3;
        const x = xs[i], z = zs[j];
        pos[k] = x;
        pos[k + 1] = height(x, z);
        pos[k + 2] = z;
      }
    const idx: number[] = [];
    for (let j = 0; j < nz - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const n = g.attributes.normal;
    const mat = new Float32Array(nx * nz * 4);
    for (let i = 0; i < nx * nz; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const slope = 1 - n.getY(i);
      let rock = sstep(0.28, 0.5, slope);
      const headK = sstep(-36, -46, z);
      const patch = fbm(x * 0.15 + 9, z * 0.15);
      let grass = clamp(sstep(0.7, 1.6, y) * headK * (0.55 + sstep(0.3, 0.5, patch) * 0.45) + sstep(9, 16, x) * sstep(0.5, 0.65, patch) * sstep(0.8, 1.6, y));
      // keep the path itself sandy
      const onPath = 1 - sstep(1.2, 2.4, Math.abs(x - 0.4));
      grass *= 1 - onPath * 0.85;
      grass *= 1 - rock;
      rock = clamp(rock);
      const sand = clamp(1 - grass - rock);
      mat[i * 4] = sand;
      mat[i * 4 + 1] = grass;
      mat[i * 4 + 2] = rock;
      // contact shade near the waterline and under props
      mat[i * 4 + 3] = (1 - sstep(-0.05, 0.25, y)) * 0.25;
    }
    g.setAttribute("aMat", new BufferAttribute(mat, 4));
    this.terrainMat = terrainMaterial(this.u, {
      uSand: { value: new Color() },
      uSandShade: { value: new Color() },
      uGrass: { value: new Color() },
      uRock: { value: new Color() },
    });
    const m = new Mesh(g, this.terrainMat);
    m.frustumCulled = false;
    this.cast(m);
    this.scene.add(m);
  }

  private buildWater() {
    // Depth below the water, baked once into a small texture: the water reads its colour and foam from it.
    const N = 256;
    const box: [number, number, number, number] = [-60, -110, 70, 25];
    const data = new Uint8Array(N * N * 4);
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const x = box[0] + ((i + 0.5) / N) * (box[2] - box[0]);
        const z = box[1] + ((j + 0.5) / N) * (box[3] - box[1]);
        const h = height(x, z);
        const k = (j * N + i) * 4;
        data[k] = Math.round(clamp(-h / 4) * 255);
        const rz = Math.abs(z - riverZ(x));
        data[k + 1] = Math.round((1 - sstep(1.5, 3.2, rz)) * sstep(-4, 0, x - coastX(z)) * 255);
        data[k + 3] = 255;
      }
    const tex = new DataTexture(data, N, N, RGBAFormat, UnsignedByteType);
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    tex.needsUpdate = true;
    this.waterMat = waterMaterial(this.u, tex, box, { uDeep: { value: new Color() }, uShallow: { value: new Color() } });
    const g = new PlaneGeometry(1400, 1400, 1, 1);
    g.rotateX(-Math.PI / 2);
    const w = new Mesh(g, this.waterMat);
    w.position.set(0, 0, -200);
    w.renderOrder = 2;
    w.frustumCulled = false;
    this.scene.add(w);
  }

  private buildStones() {
    // A worn, flat stepping stone; a thin inlaid ring on top lights up when learned.
    const prof = [
      [0, -0.4], [0.5, -0.38], [0.68, -0.26], [0.76, -0.06], [0.74, 0.08], [0.64, 0.15], [0.4, 0.18], [0, 0.185],
    ].map(([x, y]) => new Vector2(x, y));
    const body = new LatheGeometry(prof, 28);
    const p = body.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(z, x);
      const k = 1 + (noise(Math.cos(a) * 2 + 3, Math.sin(a) * 2) - 0.5) * 0.18;
      p.setXYZ(i, x * k * 1.08, y * 0.75, z * k * 0.92);
    }
    body.computeVertexNormals();
    const ring = new RingGeometry(0.36, 0.43, 40);
    ring.rotateX(-Math.PI / 2);
    ring.translate(0, 0.19, 0);
    const dot = new CircleGeometry(0.07, 16);
    dot.rotateX(-Math.PI / 2);
    dot.translate(0, 0.19, 0);
    const geo = merge([paint(body, "#A69C94", 0, 0.35), paint(ring, "#6A625C", 1), paint(dot, "#6A625C", 0.7)]);
    const stones = this.stops.filter((s) => s.kind === "stone");
    const mesh = new InstancedMesh(geo, propMaterial(this.u, { wet: true }), stones.length);
    const st = new Float32Array(stones.length * 3);
    const li = new Float32Array(stones.length * 3);
    const c = new Color(MOD[1]);
    stones.forEach((s, i) => {
      const m = new Matrix4().compose(s.pos.clone().setY(0.0), new Quaternion().setFromEuler(new Euler(0, i * 1.3, 0)), new Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
      li.set([c.r, c.g, c.b], i * 3);
    });
    geo.setAttribute("aState", new InstancedBufferAttribute(st, 3));
    geo.setAttribute("aLight", new InstancedBufferAttribute(li, 3));
    mesh.frustumCulled = false;
    this.stonesMesh = mesh;
    this.cast(mesh);
    this.scene.add(mesh);
  }

  private buildBridge() {
    const B = BRIDGE;
    const parts: BufferGeometry[] = [];
    const wood = "#7A5A44", rope = "#C9AE86";
    // posts at both banks
    for (const z of [B.z0 + 0.25, B.z1 - 0.25])
      for (const sx of [-1, 1]) {
        const x = B.x + sx * (B.width / 2 + 0.12);
        const gy = Math.min(groundAt(x, z), 0.6);
        parts.push(paint(put(new CylinderGeometry(0.09, 0.12, 1.9, 8), [x, gy + 0.6, z], [0.04 * sx, 0, 0]), wood, 0, 0.2));
        parts.push(paint(put(new SphereGeometry(0.11, 8, 6), [x, gy + 1.55, z]), wood));
      }
    // ropes: hand ropes and the two that carry the planks
    const ropeAt = (sx: number, top: boolean) => {
      const pts: Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const z = B.z0 + 0.25 + ((B.z1 - B.z0 - 0.5) * i) / 16;
        const y = deckY(z) + (top ? 0.95 + Math.sin((Math.PI * i) / 16) * 0.12 : -0.04);
        pts.push(new Vector3(B.x + sx * (B.width / 2 + (top ? 0.12 : 0.02)), y, z));
      }
      return new TubeGeometry(new CatmullRomCurve3(pts), 40, top ? 0.03 : 0.035, 5, false);
    };
    for (const sx of [-1, 1]) {
      parts.push(paint(ropeAt(sx, true), rope));
      parts.push(paint(ropeAt(sx, false), rope));
      // hangers between hand rope and deck
      for (let i = 1; i < 10; i++) {
        const z = B.z0 + ((B.z1 - B.z0) * i) / 10;
        const y0 = deckY(z), y1 = y0 + 0.95 + Math.sin((Math.PI * i) / 10) * 0.12;
        parts.push(paint(put(new CylinderGeometry(0.012, 0.012, y1 - y0, 4), [B.x + sx * (B.width / 2 + 0.07), (y0 + y1) / 2, z]), rope));
      }
    }
    const frame = new Mesh(merge(parts), propMaterial(this.u));
    this.cast(frame);
    this.scene.add(frame);

    // planks: 5 sections of 4; wood where learned, light where not yet
    const plank = paint(new BoxGeometry(B.width, 0.07, 0.3), "#8E6A4E", 0, 0.25);
    const planks = this.stops.filter((s) => s.kind === "plank");
    const n = planks.length * 4;
    this.planks = new InstancedMesh(plank, propMaterial(this.u), n);
    const gm = this.ghostMaterial();
    this.ghost = new InstancedMesh(new BoxGeometry(B.width, 0.05, 0.28), gm, n);
    const gs = new Float32Array(n * 3);
    const gl = new Float32Array(n * 3);
    const c = new Color(MOD[2]);
    planks.forEach((s, k) => {
      for (let j = 0; j < 4; j++) {
        const z = s.pos.z + (j - 1.5) * 0.34;
        const m = new Matrix4().compose(
          new Vector3(B.x + Math.sin(k * 4 + j) * 0.03, deckY(z) - 0.02, z),
          new Quaternion().setFromEuler(new Euler(0, Math.sin(k * 7 + j * 3) * 0.05, 0)),
          new Vector3(1, 1, 1),
        );
        this.plankBase.push(m);
        this.planks.setMatrixAt(k * 4 + j, m);
        this.ghost.setMatrixAt(k * 4 + j, m);
        gl.set([c.r, c.g, c.b], (k * 4 + j) * 3);
      }
    });
    this.ghost.geometry.setAttribute("aState", new InstancedBufferAttribute(gs, 3));
    this.ghost.geometry.setAttribute("aLight", new InstancedBufferAttribute(gl, 3));
    this.planks.frustumCulled = this.ghost.frustumCulled = false;
    this.ghost.renderOrder = 6;
    this.cast(this.planks);
    this.scene.add(this.planks, this.ghost);
  }

  private ghostMaterial() {
    return new ShaderMaterial({
      uniforms: { ...this.u },
      vertexShader: /* glsl */ `
        attribute vec3 aState; attribute vec3 aLight;
        varying float vK; varying vec3 vC; varying vec3 vP;
        void main() { vK = aState.x; vC = aLight; vP = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */ `
        ${COMMON}
        varying float vK; varying vec3 vC; varying vec3 vP;
        void main() {
          float edge = max(smoothstep(0.6, 0.77, abs(vP.x)), smoothstep(0.09, 0.14, abs(vP.z)));
          float a = (0.25 + edge * 0.75) * vK;
          gl_FragColor = vec4(vC * a * 1.5, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
  }

  private buildCamp() {
    const fires = this.stops.filter((s) => s.kind === "fire");
    this.fires = fires;
    const parts: BufferGeometry[] = [];
    for (const f of fires) {
      const { x, y, z } = f.pos;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        parts.push(paint(put(rockGeo(i + x), [x + Math.cos(a) * 0.55, y + 0.05, z + Math.sin(a) * 0.55], [0, a, 0], [0.16, 0.14, 0.13]), "#8D8580", 0, 0.3));
      }
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        parts.push(paint(put(new CylinderGeometry(0.055, 0.07, 0.8, 6), [x + Math.cos(a) * 0.12, y + 0.18, z + Math.sin(a) * 0.12], [Math.sin(a) * 1.1, 0, Math.cos(a) * 1.1]), "#5B4334", 0, 0.3));
      }
      // charcoal glows a little even when the fire is low
      parts.push(paint(put(new CircleGeometry(0.32, 12), [x, y + 0.04, z], [-Math.PI / 2, 0, 0]), "#3A2A22", 0));
      // a log to sit on
      parts.push(paint(put(new CylinderGeometry(0.16, 0.17, 1.3, 9), [x + 0.4, y + 0.14, z - 1.05], [0, 0.5, Math.PI / 2]), "#6B4E3A", 0, 0.3));
    }
    this.scene.add(this.cast(new Mesh(merge(parts), propMaterial(this.u))));
    // flames
    const fg = new PlaneGeometry(0.95, 1.45);
    fg.translate(0, 0.72, 0);
    this.flames = new InstancedMesh(fg, flameMaterial(this.u), fires.length);
    fires.forEach((f, i) => {
      this.flames.setMatrixAt(i, new Matrix4().makeTranslation(f.pos.x, f.pos.y + 0.05, f.pos.z));
      this.u.uLP.value[i].set(f.pos.x, f.pos.y + 0.6, f.pos.z);
    });
    this.flames.geometry.setAttribute("aState", new InstancedBufferAttribute(new Float32Array(fires.length * 3), 3));
    this.flames.frustumCulled = false;
    this.flames.renderOrder = 7;
    this.scene.add(this.flames);
    // embers
    const E = 18;
    const eg = new BufferGeometry();
    const ep = new Float32Array(fires.length * E * 3), es = new Float32Array(fires.length * E * 4);
    fires.forEach((f, i) => {
      for (let k = 0; k < E; k++) {
        const j = i * E + k;
        ep.set([f.pos.x, f.pos.y + 0.3, f.pos.z], j * 3);
        es.set([Math.random(), Math.random(), Math.random(), Math.random()], j * 4);
      }
    });
    eg.setAttribute("position", new BufferAttribute(ep, 3));
    eg.setAttribute("aSeed", new BufferAttribute(es, 4));
    const em = moteMaterial(this.u, "ember");
    this.pointMats.push(em);
    this.embers = new Points(eg, em);
    this.embers.frustumCulled = false;
    this.embers.renderOrder = 8;
    this.scene.add(this.embers);

    // camp items: a map on a flat rock, a compass on a stump, a lantern on a post
    const mint = new Color(MOD[3]);
    for (const s of this.stops.filter((q) => q.kind === "item")) {
      const { x, y, z } = s.pos;
      const g: BufferGeometry[] = [];
      if (s.item === "map") {
        g.push(paint(put(rockGeo(3, 1), [0, 0.1, 0], [0, 0.3, 0], [0.75, 0.5, 0.6]), "#9A9088", 0, 0.3));
        g.push(paint(put(new BoxGeometry(0.8, 0.012, 0.55), [0, 0.36, 0], [0.04, 0.3, 0.02]), "#EADBC0", 0, 0.1));
        // route lines on the map
        for (let i = 0; i < 4; i++) g.push(paint(put(new BoxGeometry(0.5 - i * 0.08, 0.004, 0.018), [-0.05 + i * 0.03, 0.372, -0.15 + i * 0.1], [0.04, 0.3 + i * 0.4, 0.02]), "#8A6A4A", 1));
        g.push(paint(put(new CylinderGeometry(0.045, 0.045, 0.6, 8), [-0.4, 0.4, 0.1], [0, 0.3, Math.PI / 2]), "#D8C6A4"));
      } else if (s.item === "compass") {
        g.push(paint(put(new CylinderGeometry(0.32, 0.38, 0.5, 10), [0, 0.2, 0]), "#6B4E3A", 0, 0.3));
        g.push(paint(put(new CylinderGeometry(0.2, 0.2, 0.06, 20), [0, 0.48, 0]), "#B08A4A"));
        g.push(paint(put(new TorusGeometry(0.2, 0.02, 6, 24), [0, 0.51, 0], [Math.PI / 2, 0, 0]), "#D6B26A"));
        g.push(paint(put(new BoxGeometry(0.03, 0.01, 0.3), [0, 0.52, 0], [0, 0.6, 0]), "#3B3230", 1));
        g.push(paint(put(new CircleGeometry(0.17, 20), [0, 0.515, 0], [-Math.PI / 2, 0, 0]), "#F2E7D0", 0.25));
      } else {
        g.push(paint(put(new CylinderGeometry(0.05, 0.07, 1.8, 7), [0, 0.9, 0]), "#5B4334", 0, 0.2));
        g.push(paint(put(new BoxGeometry(0.5, 0.05, 0.05), [0.22, 1.75, 0]), "#5B4334"));
        g.push(paint(put(new CylinderGeometry(0.12, 0.14, 0.26, 6), [0.42, 1.48, 0]), "#C8D6CC", 1));
        g.push(paint(put(new ConeGeometry(0.17, 0.14, 6), [0.42, 1.68, 0]), "#3B3230"));
        g.push(paint(put(new CylinderGeometry(0.15, 0.15, 0.04, 6), [0.42, 1.34, 0]), "#3B3230"));
        g.push(paint(put(new TorusGeometry(0.05, 0.012, 4, 10), [0.42, 1.77, 0]), "#3B3230"));
      }
      const geo = merge(g);
      const mesh = new InstancedMesh(geo, propMaterial(this.u), 1);
      mesh.setMatrixAt(0, new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(0, s.item === "lantern" ? 0.8 : 0, 0)), new Vector3(1, 1, 1)));
      geo.setAttribute("aState", new InstancedBufferAttribute(new Float32Array(3), 3));
      geo.setAttribute("aLight", new InstancedBufferAttribute(new Float32Array([mint.r, mint.g, mint.b]), 3));
      mesh.frustumCulled = false;
      this.items[s.id] = mesh;
      this.cast(mesh);
      this.scene.add(mesh);
      if (s.item === "lantern") this.u.uLP.value[3].set(x + 0.3, y + 1.5, z + 0.3);
    }

    // the telescope at the top, looking out to the next land
    const T = TELESCOPE;
    const ty = groundAt(T.x, T.z);
    const tp: BufferGeometry[] = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      tp.push(paint(put(new CylinderGeometry(0.025, 0.035, 1.5, 6), [Math.cos(a) * 0.28, 0.68, Math.sin(a) * 0.28], [Math.sin(a) * 0.38, 0, -Math.cos(a) * 0.38]), "#5B4334"));
    }
    tp.push(paint(put(new CylinderGeometry(0.07, 0.11, 1.3, 14), [0, 1.42, -0.1], [-1.25, 0, 0.3]), "#B48A3E"));
    tp.push(paint(put(new TorusGeometry(0.115, 0.018, 6, 16), [0.08, 1.6, -0.62], [0.3, 0.3, 0]), "#E0BE70"));
    tp.push(paint(put(new CylinderGeometry(0.04, 0.05, 0.25, 8), [-0.1, 1.24, 0.5], [-1.25, 0, 0.3]), "#3B3230"));
    const tel = new Mesh(merge(tp), propMaterial(this.u));
    tel.position.set(T.x, ty, T.z);
    tel.rotation.y = 0.5;
    this.scene.add(this.cast(tel));
  }
  private embers!: Points;

  private buildPath() {
    // footprints every 0.55 m along the path, skipping the bridge (its planks show progress)
    const pts: Vector3[] = [];
    const seg: number[] = [];
    const n = Math.floor(this.len / 0.55);
    const ts = this.stopT;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const p = this.curve.getPointAt(t);
      if (p.z < BRIDGE.z0 + 0.3 && p.z > BRIDGE.z1 - 0.3) continue;
      // keep clear of the stops themselves
      if (this.stops.some((s) => Math.hypot(s.foot.x - p.x, s.foot.z - p.z) < (s.kind === "fire" ? 0.6 : 0.7))) continue;
      // skip the water of the tide pool: the stones are the path there
      const ex = (p.x - POOL.x) / POOL.rx, ez = (p.z - POOL.z) / POOL.rz;
      if (Math.sqrt(ex * ex + ez * ez) < 0.95) continue;
      let k = ts.findIndex((q) => q > t);
      if (k < 0) k = ts.length;
      seg.push(k);
      p.y = Math.max(groundAt(p.x, p.z), 0.02) + 0.03;
      pts.push(p);
    }
    const g = paint(new CircleGeometry(0.075, 10).rotateX(-Math.PI / 2), "#6E5A48", 1);
    this.dots = new InstancedMesh(g, propMaterial(this.u), pts.length);
    const st = new Float32Array(pts.length * 3), li = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      const side = i % 2 ? 0.1 : -0.1;
      this.dots.setMatrixAt(i, new Matrix4().compose(p.clone().add(new Vector3(side, 0, 0)), new Quaternion(), new Vector3(1, 1, 1.35)));
      const k = seg[i];
      const mod = k < this.stops.length ? this.stops[k].module : 3;
      const c = new Color(MOD[mod]);
      li.set([c.r, c.g, c.b], i * 3);
    });
    g.setAttribute("aState", new InstancedBufferAttribute(st, 3));
    g.setAttribute("aLight", new InstancedBufferAttribute(li, 3));
    this.dots.frustumCulled = false;
    this.dotSeg = seg;
    this.segLit = new Array(this.stops.length + 1).fill(0);
    this.segTo = [...this.segLit];
    this.scene.add(this.dots);
  }

  private buildGate() {
    // Two tall standing stones with a seam of light; beyond them, mist over the water to Level 2.
    const x = GATE.x, z = GATE.z, y = groundAt(x, z) - 0.3;
    const g: BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      const stone = new BoxGeometry(1.5, 5.4, 1.1, 3, 8, 2);
      const p = stone.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const py = p.getY(i);
        const taper = 1 - (py + 2.7) / 5.4 * 0.28;
        p.setXYZ(i, p.getX(i) * taper + (noise(py * 0.8, sx * 3) - 0.5) * 0.12, py, p.getZ(i) * taper);
      }
      stone.computeVertexNormals();
      g.push(paint(put(stone, [x + sx * 2.1, y + 2.7, z], [0, sx * 0.08, sx * -0.05]), "#B3A69C", 0, 0.3));
      // the seam of light facing the path
      g.push(paint(put(new BoxGeometry(0.07, 4.4, 0.02), [x + sx * 2.1 - sx * 0.2, y + 2.8, z + 0.57], [0, sx * 0.08, sx * -0.05]), "#5A524C", 1));
    }
    // a lintel of cloth between them is done by the banners; a low step marks the threshold
    g.push(paint(put(new BoxGeometry(3.2, 0.18, 1.0), [x, y + 0.35, z]), "#A69C94", 0, 0.2));
    const geo = merge(g);
    this.gateMesh = new InstancedMesh(geo, propMaterial(this.u), 1);
    this.gateMesh.setMatrixAt(0, new Matrix4());
    const gold = new Color(MOD[1]);
    geo.setAttribute("aState", new InstancedBufferAttribute(new Float32Array(3), 3));
    geo.setAttribute("aLight", new InstancedBufferAttribute(new Float32Array([gold.r, gold.g, gold.b]), 3));
    this.gateMesh.frustumCulled = false;
    this.scene.add(this.cast(this.gateMesh));
    this.u.uLP.value[4].set(x, y + 2.5, z + 1);

    // mist: a soft curtain past the gate and banks low on the water
    for (let i = 0; i < 4; i++) {
      const mm = new Mesh(new PlaneGeometry(90, 22), mistMaterial(this.u, 0.9));
      mm.position.set(x - 6 + i * 3, 6 + i * 2, z - 10 - i * 9);
      mm.renderOrder = 9 + i;
      this.scene.add(mm);
    }
    for (let i = 0; i < 3; i++) {
      const mm = new Mesh(new PlaneGeometry(220, 120), mistMaterial(this.u, 0.55));
      mm.rotation.x = -Math.PI / 2;
      mm.position.set(-30 + i * 20, 1.5 + i * 1.2, -130 - i * 70);
      mm.renderOrder = 3;
      this.scene.add(mm);
    }
  }

  private buildScatter() {
    // rocks around the pool, along the coast and on the headland
    const rocks: Matrix4[] = [];
    const add = (x: number, z: number, s: number, sink = 0.35) => {
      const y = height(x, z);
      rocks.push(new Matrix4().compose(new Vector3(x, y - s * sink, z), new Quaternion().setFromEuler(new Euler(0, x * 13.1 + z, 0)), new Vector3(s * (1 + noise(x, z) * 0.5), s, s)));
    };
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + noise(i, 2) * 0.4;
      const r = 1.02 + noise(i * 3, 1) * 0.12;
      if (Math.abs(a - Math.PI / 2) < 0.25 || Math.abs(a - Math.PI * 1.5) < 0.25) continue; // the path in and out
      add(POOL.x + Math.cos(a) * POOL.rx * r, POOL.z + Math.sin(a) * POOL.rz * r, 0.25 + noise(i, 7) * 0.4);
    }
    for (let i = 0; i < 40; i++) {
      const z = 10 - i * 2.1 - noise(i, 5) * 2;
      add(coastX(z) - 0.5 + noise(i, 9) * 3, z, 0.4 + noise(i, 4) * 0.9, 0.5);
    }
    for (let i = 0; i < 26; i++) {
      const z = -38 - noise(i, 11) * 24, x = -10 + noise(i, 13) * 24;
      if (Math.abs(x - 0.4) < 2.4) continue;
      add(x, z, 0.3 + noise(i, 17) * 0.8);
    }
    // a few large boulders on the dunes
    for (let i = 0; i < 12; i++) add(10 + noise(i, 21) * 26, 8 - i * 6, 0.8 + noise(i, 23) * 1.4, 0.5);
    const rm = new InstancedMesh(paint(rockGeo(2, 1), "#A0968E", 0, 0.35), propMaterial(this.u, { wet: true }), rocks.length);
    rocks.forEach((m, i) => rm.setMatrixAt(i, m));
    rm.frustumCulled = false;
    this.scene.add(this.cast(rm));

    // grass: marram on the dunes, meadow on the headland
    const tufts: Matrix4[] = [];
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 5200 && tufts.length < 2200; i++) {
      const x = -12 + rnd() * 48, z = 14 - rnd() * 80;
      const y = height(x, z);
      if (y < 0.35) continue;
      if (Math.abs(x - 0.4) < 1.4 && z > -60) continue; // the path stays clear
      const head = sstep(-36, -44, z) * sstep(1, 2, y);
      const dune = sstep(6, 12, x) * sstep(0.45, 0.6, fbm(x * 0.2, z * 0.2));
      const near = sstep(0.5, 1.2, y) * sstep(0.55, 0.75, fbm(x * 0.3 + 5, z * 0.3)) * (1 - sstep(4, 8, Math.abs(x - 0.4)) * 0);
      const p = Math.max(head * 0.9, dune * 0.8, near * 0.35);
      if (rnd() > p) continue;
      const s = 0.7 + rnd() * 0.8;
      tufts.push(new Matrix4().compose(new Vector3(x, y - 0.03, z), new Quaternion().setFromEuler(new Euler(0, rnd() * 6.28, 0)), new Vector3(s, s * (0.8 + rnd() * 0.6), s)));
    }
    const tm = new InstancedMesh(tuftGeo(), propMaterial(this.u, { wind: true }), tufts.length);
    tufts.forEach((m, i) => tm.setMatrixAt(i, m));
    tm.frustumCulled = false;
    this.scene.add(tm);

  }

  private buildCloth() {
    // Banners on tall poles beside the path, cloth flowing in the wind.
    const poles: [number, number][] = [[-2.2, -1.5], [3.6, -18.5], [-1.2, -24.8], [2.6, -35.2], [-3.2, -48.5], [3.4, -53], [-1.4, -60.6], [2.6, -60.6]];
    const pg: BufferGeometry[] = [];
    const cloth = new PlaneGeometry(1.7, 0.26, 18, 2);
    cloth.translate(0.85, 0, 0);
    const cm = new InstancedMesh(cloth, clothMaterial(this.u), poles.length);
    const st = new Float32Array(poles.length * 3);
    poles.forEach(([x, z], i) => {
      const y = groundAt(x, z);
      const h = i >= 6 ? 4.8 : 3.0;
      pg.push(paint(put(new CylinderGeometry(0.035, 0.05, h, 6), [x, y + h / 2, z]), "#5B4334"));
      pg.push(paint(put(new SphereGeometry(0.06, 6, 4), [x, y + h, z]), "#C9A35A"));
      // cloth streams away from the sea wind, to the right and back
      cm.setMatrixAt(i, new Matrix4().compose(new Vector3(x, y + h - 0.25, z), new Quaternion().setFromEuler(new Euler(0, -0.5 - (i % 3) * 0.2, 0)), new Vector3(1, 1, 1)));
      st.set([i * 0.37, 1, i >= 6 ? 0.25 : 0], i * 3);
    });
    cm.geometry.setAttribute("aState", new InstancedBufferAttribute(st, 3));
    cm.frustumCulled = false;
    this.scene.add(cm, this.cast(new Mesh(merge(pg), propMaterial(this.u))));

  }

  private buildFar() {
    // The lands still to come, as silhouettes in the haze. Later phases replace these with real places.
    const fm = farMaterial(this.u);
    const land = (r: number, h: number, seed: number, col: string, flat = 0) => {
      const g = new SphereGeometry(r, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const a = Math.atan2(z, x);
        const k = 0.8 + noise(Math.cos(a) * 3 + seed, Math.sin(a) * 3) * 0.4;
        let yy = Math.pow(y / r, 1.5) * h * (0.7 + fbm(x * 0.04 + seed, z * 0.04) * 0.6);
        if (flat) yy = Math.min(yy * 1.35, h * flat * (0.97 + noise(x * 0.1, z * 0.1) * 0.06));
        p.setXYZ(i, x * k, yy, z * k);
      }
      g.computeVertexNormals();
      return paint(g, col, 0, 0.3);
    };
    const jungle = new Mesh(land(55, 20, 1, "#3A5A50"), fm);
    jungle.position.set(-22, -2, -175);
    const ridge = new Mesh(land(80, 48, 4, "#7C5A54", 0.85), fm);
    ridge.position.set(62, -2, -340);
    const table = new Mesh(land(60, 170, 7, "#6A6488", 0.92), fm);
    table.position.set(-12, -2, -680);
    this.scene.add(jungle, ridge, table);
    // the summit glows: light as the reward
    const bm = beaconMaterial(this.u);
    bm.uniforms.uCol.value = new Color("#FFD27A");
    bm.uniforms.uK.value = 0.7;
    const bg = new PlaneGeometry(1, 1);
    bg.translate(0, 0.5, 0);
    const b = new Mesh(bg, bm);
    b.scale.set(16, 260, 1);
    b.position.set(-12, 150, -680);
    b.frustumCulled = false;
    this.scene.add(b);
    // a cloud sea around the far lands
    for (let i = 0; i < 5; i++) {
      const mm = new Mesh(new PlaneGeometry(420, 260), mistMaterial(this.u, 0.8));
      mm.rotation.x = -Math.PI / 2;
      mm.position.set(-10 + (i % 2) * 40, 8 + i * 9, -260 - i * 45);
      mm.renderOrder = 3;
      this.scene.add(mm);
    }
  }

  private buildLife() {
    // god rays from the sun side, following the camera
    this.rays = new Group();
    const rm = rayMaterial(this.u);
    for (let i = 0; i < 4; i++) {
      const p = new Mesh(new PlaneGeometry(18, 60), rm);
      p.position.set(-14 + i * 5, 14, -18 - i * 5);
      p.rotation.set(0, 0.5, -0.55 + i * 0.06);
      p.frustumCulled = false;
      p.renderOrder = 11;
      this.rays.add(p);
    }
    this.scene.add(this.rays);

    // birds over the water
    const bg = new BufferGeometry();
    bg.setAttribute("position", new Float32BufferAttribute([-1, 0, 0.2, 0, 0, 0, 0, 0, 0.35, 0, 0, 0, 1, 0, 0.2, 0, 0, 0.35], 3));
    const B = 9;
    const ib = new InstancedMesh(bg, birdMaterial(this.u), B);
    const seeds = new Float32Array(B * 4);
    for (let i = 0; i < B; i++) {
      ib.setMatrixAt(i, new Matrix4());
      seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    bg.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 4));
    ib.frustumCulled = false;
    this.birds = ib;
    this.scene.add(ib);

    // fireflies around the camp and the meadow (only really visible at dusk and night)
    const F = 140;
    const fg = new BufferGeometry();
    const fp = new Float32Array(F * 3), fs = new Float32Array(F * 4);
    for (let i = 0; i < F; i++) {
      const z = -16 - Math.random() * 44, x = -6 + Math.random() * 13;
      fp.set([x, Math.max(0.3, groundAt(x, z)) + 0.4 + Math.random() * 1.6, z], i * 3);
      fs.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    fg.setAttribute("position", new BufferAttribute(fp, 3));
    fg.setAttribute("aSeed", new BufferAttribute(fs, 4));
    const fmm = moteMaterial(this.u, "firefly");
    this.flies = new Points(fg, fmm);
    this.flies.frustumCulled = false;
    this.flies.renderOrder = 12;
    this.scene.add(this.flies);

    // motes of light drifting up the path
    const M = 120;
    const mg = new BufferGeometry();
    const mp = new Float32Array(M * 3), ms = new Float32Array(M * 4);
    for (let i = 0; i < M; i++) {
      const z = 6 - Math.random() * 70, x = -5 + Math.random() * 11;
      mp.set([x, Math.max(0, groundAt(x, z)) + Math.random() * 2, z], i * 3);
      ms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    mg.setAttribute("position", new BufferAttribute(mp, 3));
    mg.setAttribute("aSeed", new BufferAttribute(ms, 4));
    const mm = moteMaterial(this.u, "mote");
    this.pointMats.push(mm);
    const motes = new Points(mg, mm);
    motes.frustumCulled = false;
    motes.renderOrder = 12;
    this.scene.add(motes);
  }

  dispose() {
    this.scene.traverse((o: Object3D) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as ShaderMaterial | undefined;
      mat?.dispose?.();
    });
  }
}
void DoubleSide;
void TubeGeometry;
void GATE_Z;
