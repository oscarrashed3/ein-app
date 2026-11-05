import { AdditiveBlending, BackSide, DoubleSide, NormalBlending, ShaderMaterial, type IUniform, type Texture } from "three";
import type { Shared } from "./palette";

/**
 * Hand-written shaders. One light model for the whole world: a sun (or moon) with wrapped diffuse,
 * sky ambient, back-lit rim, warm point glows from fires and lanterns, and fog that fades into the
 * sky colour in that direction, so the horizon never shows a seam.
 */
export const COMMON = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir, uSun, uZenith, uMid, uHorizon, uBelow, uSkyAmb, uGroundAmb, uFog, uCam;
uniform float uStars, uFireK;
uniform vec3 uLP[8];
uniform float uLR[8];
uniform vec3 uLC[8];
uniform sampler2D uShadowMap;
uniform mat4 uShadowMat;
uniform float uShadowOn;

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 hash32(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float fbm2(vec2 p) { return vnoise(p) * .55 + vnoise(p * 2.07 + 7.3) * .3 + vnoise(p * 4.13 + 1.7) * .15; }

vec3 skyColor(vec3 d) {
  float y = d.y;
  vec3 c = y > 0. ? mix(uHorizon, uMid, smoothstep(0.0, 0.22, y)) : mix(uHorizon, uBelow, smoothstep(0., -0.25, y));
  c = mix(c, uZenith, smoothstep(0.18, 0.75, y));
  float s = max(dot(d, uSunDir), 0.);
  c += uSun * (pow(s, 5.) * 0.16 + pow(s, 48.) * 0.35);
  return c;
}
vec3 fogged(vec3 col, vec3 wp) {
  vec3 dv = wp - uCam;
  float d = length(dv);
  vec3 vd = dv / d;
  float f = smoothstep(uFog.x, uFog.y, d);
  float low = exp(-max(wp.y + 0.5, 0.) * 0.3) * smoothstep(20., 110., d) * 0.35;
  f = clamp(f + low * (1. - f), 0., 1.);
  vec3 fc = skyColor(normalize(vec3(vd.x, max(vd.y, 0.0) * 0.5 + 0.02, vd.z)));
  return mix(col, fc, f);
}
vec3 glows(vec3 wp, vec3 n) {
  vec3 s = vec3(0.);
  for (int i = 0; i < 8; i++) {
    vec3 l = uLP[i] - wp;
    float d = length(l);
    float a = 1. - smoothstep(0., uLR[i], d);
    a *= a;
    s += uLC[i] * a * (max(dot(n, l / max(d, 1e-3)), 0.) * .75 + .25);
  }
  return s * uFireK;
}
float shadowAt(vec3 wp, vec3 n) {
  if (uShadowOn < 0.5) return 1.;
  vec4 sp = uShadowMat * vec4(wp + n * 0.06, 1.);
  vec3 q = sp.xyz / sp.w * 0.5 + 0.5;
  if (q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1. || q.z > 1.) return 1.;
  float bias = 0.0015;
  float s = 0.;
  vec2 px = vec2(1. / 2048.);
  for (int i = -1; i <= 1; i++)
    for (int j = -1; j <= 1; j++)
      s += step(q.z - bias, texture2D(uShadowMap, q.xy + vec2(float(i), float(j)) * px * 1.6).r);
  s /= 9.;
  // fade out at the edges of the shadow area
  vec2 e = smoothstep(0., 0.08, q.xy) * smoothstep(1., 0.92, q.xy);
  return mix(1., s, e.x * e.y);
}
vec3 shade(vec3 alb, vec3 n, vec3 wp, float wrapK, float rimK) {
  vec3 v = normalize(uCam - wp);
  float ndl = dot(n, uSunDir);
  float dif = clamp((ndl + wrapK) / (1. + wrapK), 0., 1.);
  dif *= mix(0.12, 1., shadowAt(wp, n));
  vec3 amb = mix(uGroundAmb, uSkyAmb, n.y * .5 + .5);
  vec3 c = alb * (amb + uSun * dif * .8 + glows(wp, n));
  float fr = pow(1. - max(dot(n, v), 0.), 4.);
  float back = pow(max(dot(-v, uSunDir), 0.), 2.);
  c += uSun * fr * (0.06 + back * 0.55) * rimK;
  return c;
}
`;

const END = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

/** Instancing-aware world position and normal. */
const VTX = /* glsl */ `
  vec4 lp = vec4(position, 1.);
  vec3 ln = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp;
    ln = mat3(instanceMatrix) * ln;
  #endif
  vec4 wp4 = modelMatrix * lp;
`;

function mat(sh: Shared, extra: Record<string, IUniform>, vertexShader: string, fragmentShader: string, opts: Partial<ShaderMaterial> = {}) {
  const m = new ShaderMaterial({ uniforms: { ...sh, ...extra }, vertexShader: "uniform float uTime;\n" + vertexShader, fragmentShader });
  Object.assign(m, opts);
  return m;
}

// ---------------------------------------------------------------- sky
export function skyMaterial(sh: Shared) {
  return mat(
    sh,
    {},
    /* glsl */ `
    varying vec3 vD;
    void main() {
      vD = position;
      vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      gl_Position = p.xyww;
    }`,
    /* glsl */ `
    ${COMMON}
    varying vec3 vD;
    void main() {
      vec3 d = normalize(vD);
      vec3 c = skyColor(d);
      float s = max(dot(d, uSunDir), 0.);
      // sun (or moon) disc, soft-edged
      c += uSun * smoothstep(0.9993, 0.9997, s) * (uStars > .5 ? 1.4 : 3.5);
      // clouds: long soft bands above the horizon, lit from the sun side
      if (d.y > -0.02) {
        vec2 p = d.xz / (d.y + 0.18) * 1.4;
        float cl = fbm2(p * vec2(0.55, 1.4) + vec2(uTime * 0.004, 0.));
        cl = smoothstep(0.52, 0.78, cl) * smoothstep(-0.02, 0.08, d.y) * (1. - smoothstep(0.25, 0.6, d.y));
        vec3 cc = mix(uMid * 1.05, uHorizon * 1.08 + uSun * 0.18, pow(s, 3.));
        c = mix(c, cc, cl * 0.55);
      }
      // stars
      if (uStars > 0.) {
        vec3 q = d * 260.;
        vec2 cell = floor(q.xz + q.y * 1.7);
        float h = hash12(cell);
        vec2 f = fract(q.xz + q.y * 1.7) - .5;
        float st = smoothstep(0.08, 0., length(f)) * step(0.985, h) * smoothstep(0.02, 0.25, d.y);
        st *= 0.6 + 0.4 * sin(uTime * (1. + h * 3.) + h * 40.);
        c += vec3(0.85, 0.9, 1.) * st * uStars * 1.6;
        // a faint band of the milky way
        float band = exp(-pow(dot(d, normalize(vec3(0.4, 0.6, -0.7))) * 4., 2.)) * fbm2(d.xy * 6.) * 0.12;
        c += vec3(0.5, 0.55, 0.9) * band * uStars;
      }
      gl_FragColor = vec4(c, 1.);
      ${END}
    }`,
    { side: BackSide, depthWrite: false },
  );
}

// ---------------------------------------------------------------- terrain: sand that sparkles, grass, rock
export function terrainMaterial(sh: Shared, cols: Record<string, IUniform>) {
  return mat(
    sh,
    cols,
    /* glsl */ `
    attribute vec4 aMat; // sand, grass, rock, contact shade
    varying vec3 vW; varying vec3 vN; varying vec4 vM;
    void main() {
      ${VTX}
      vW = wp4.xyz; vN = normalize(mat3(modelMatrix) * ln); vM = aMat;
      gl_Position = projectionMatrix * viewMatrix * wp4;
    }`,
    /* glsl */ `
    ${COMMON}
    uniform vec3 uSand, uSandShade, uGrass, uRock;
    varying vec3 vW; varying vec3 vN; varying vec4 vM;
    void main() {
      vec3 n = normalize(vN);
      vec3 v = normalize(uCam - vW);
      float dist = length(uCam - vW);
      float sand = vM.x, grass = vM.y, rock = vM.z;
      float wet = 1. - smoothstep(0.02, 0.34, vW.y);
      // wind ripples in the sand (normal only)
      vec2 dir = normalize(vec2(0.85, 0.52));
      float ph = dot(vW.xz, dir) * 6.5 + fbm2(vW.xz * 0.45) * 7.;
      float fade = 1. - smoothstep(14., 40., dist);
      n = normalize(n + vec3(dir.x, 0., dir.y) * cos(ph) * 0.16 * sand * (1. - wet) * fade);
      float nz = fbm2(vW.xz * 0.35);
      vec3 sc = mix(uSandShade, uSand, 0.55 + 0.45 * nz);
      sc = mix(sc, sc * 0.6, wet);
      vec3 gc = uGrass * (0.72 + 0.5 * fbm2(vW.xz * 0.7 + 4.));
      vec3 rc = uRock * (0.78 + 0.28 * sin(vW.y * 4.5 + nz * 4.) * 0.5 + 0.2 * fbm2(vW.xz * 1.3));
      vec3 alb = sc * sand + gc * grass + rc * rock;
      alb *= mix(1., 0.72, vM.w);
      alb = mix(alb, alb * vec3(0.55, 0.85, 0.85), 1. - smoothstep(-0.25, 0.0, vW.y));
      vec3 col = shade(alb, n, vW, 0.35, 0.6 + grass * 0.6);
      // glitter: tiny facets catch the sun, view dependent
      vec2 cell = floor(vW.xz * 30.);
      vec3 r = hash32(cell);
      vec3 fn = normalize(n + (r - 0.5) * 1.5);
      vec3 hv = normalize(uSunDir + v);
      float g = pow(max(dot(fn, hv), 0.), 260.) * step(0.62, r.z) * sand * (1. - smoothstep(5., 20., dist)) * smoothstep(0.0, 0.12, vW.y);
      col += uSun * g * 4.5 * (1. - uStars * 0.75);
      // wet sand mirrors the sky a little
      float fr = pow(1. - max(dot(n, v), 0.), 3.);
      col = mix(col, skyColor(reflect(-v, n)) * 0.9, wet * fr * 0.55);
      col = fogged(col, vW);
      gl_FragColor = vec4(col, 1.);
      ${END}
    }`,
  );
}

// ---------------------------------------------------------------- water: sea, tide pool and river in one plane
export function waterMaterial(sh: Shared, tex: Texture, box: [number, number, number, number], cols: Record<string, IUniform>) {
  return mat(
    sh,
    { uH: { value: tex }, uBox: { value: box }, ...cols },
    /* glsl */ `
    varying vec3 vW;
    void main() { vec4 wp4 = modelMatrix * vec4(position, 1.); vW = wp4.xyz; gl_Position = projectionMatrix * viewMatrix * wp4; }`,
    /* glsl */ `
    ${COMMON}
    uniform sampler2D uH; uniform vec4 uBox; uniform vec3 uDeep, uShallow;
    varying vec3 vW;
    float wave(vec2 p, vec2 flow) {
      return fbm2(p * 0.42 + flow + vec2(uTime * 0.05, uTime * 0.03)) + 0.5 * vnoise(p * 1.3 - vec2(uTime * 0.11, -uTime * 0.07) + flow * 2.);
    }
    void main() {
      vec2 uv = (vW.xz - uBox.xy) / (uBox.zw - uBox.xy);
      vec4 H = (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) ? vec4(1., 0., 0., 0.) : texture2D(uH, uv);
      float depth = H.r * 4.;
      float river = H.g;
      vec2 flow = vec2(-uTime * 0.35, 0.) * river;
      float e = 0.12;
      float w0 = wave(vW.xz, flow), wx = wave(vW.xz + vec2(e, 0.), flow), wz = wave(vW.xz + vec2(0., e), flow);
      float amp = mix(0.5, 0.18, 1. - smoothstep(0., 1.2, depth));
      vec3 n = normalize(vec3(-(wx - w0) / e * amp, 1., -(wz - w0) / e * amp));
      vec3 v = normalize(uCam - vW);
      float dist = length(uCam - vW);
      vec3 body = mix(uShallow, uDeep, smoothstep(0.05, 2.4, depth));
      vec3 amb = mix(uGroundAmb, uSkyAmb, 0.8);
      vec3 col = body * (amb * 1.2 + uSun * 0.35 + glows(vW, vec3(0., 1., 0.)) * 0.6);
      float fr = 0.03 + 0.97 * pow(1. - max(dot(n, v), 0.), 5.);
      vec3 rd = reflect(-v, n);
      rd.y = abs(rd.y);
      col = mix(col, skyColor(rd), fr * 0.85);
      // sun glint and sparkle
      float sp = pow(max(dot(reflect(-uSunDir, n), v), 0.), 220.);
      col += uSun * sp * 5.;
      // foam: a soft line where water meets land, and bands that roll in
      float edge = 1. - smoothstep(0.0, 0.11 + 0.05 * sin(uTime * 0.9 + vW.x * 0.6), depth);
      float bands = smoothstep(0.72, 0.95, sin(depth * 14. - uTime * 1.5 + fbm2(vW.xz * 0.8) * 5.)) * (1. - smoothstep(0.1, 0.55, depth)) * (1. - river);
      float foam = clamp(edge * 0.85 + bands * 0.5, 0., 1.) * (0.6 + 0.4 * fbm2(vW.xz * 2.4 + uTime * 0.2));
      foam += river * smoothstep(0.7, 0.9, fbm2(vec2(vW.x * 0.9 + uTime * 0.9, vW.z * 2.))) * 0.25;
      vec3 fc = vec3(1.) * (amb * 1.3 + uSun * 0.7);
      col = mix(col, fc, clamp(foam, 0., 1.));
      float a = mix(0.22, 0.97, smoothstep(0.0, 1.8, depth));
      a = max(a, foam);
      a *= smoothstep(0.0, 0.025, depth + foam * 0.02);
      col = fogged(col, vW);
      gl_FragColor = vec4(col, a);
      ${END}
    }`,
    { transparent: true, depthWrite: false },
  );
}

// ---------------------------------------------------------------- props: vertex coloured, lit, with emissive and per-instance state
/**
 * aEmit: 0 = plain surface; >0 = part that glows in the instance's light colour.
 * Per instance (optional): aState.x = how lit (0 off .. 1 full), aState.y = pulse (0/1), aState.z = visible scale handled by matrix.
 */
export function propMaterial(sh: Shared, opts: { wind?: boolean; wet?: boolean } = {}) {
  return mat(
    sh,
    {},
    /* glsl */ `
    attribute vec3 color;
    attribute float aEmit;
    #ifdef USE_INSTANCING
      attribute vec3 aState;
      attribute vec3 aLight;
    #endif
    varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vE; varying vec3 vS; varying vec3 vL;
    void main() {
      ${VTX}
      ${opts.wind ? "float sway = (position.y) * (position.y) * 0.18; wp4.x += sin(uTime * 1.3 + wp4.z * 0.6 + wp4.x * 0.3) * sway; wp4.z += cos(uTime * 1.1 + wp4.x * 0.5) * sway * 0.5;" : ""}
      vW = wp4.xyz; vN = normalize(mat3(modelMatrix) * ln); vC = color; vE = aEmit;
      #ifdef USE_INSTANCING
        vS = aState; vL = aLight;
      #else
        vS = vec3(1., 0., 0.); vL = vec3(1.);
      #endif
      gl_Position = projectionMatrix * viewMatrix * wp4;
    }`,
    /* glsl */ `
    ${COMMON}
    varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vE; varying vec3 vS; varying vec3 vL;
    void main() {
      vec3 n = normalize(vN);
      if (!gl_FrontFacing) n = -n;
      vec3 alb = vC;
      ${opts.wet ? "alb *= mix(1., 0.62, 1. - smoothstep(0.05, 0.3, vW.y));" : ""}
      vec3 col = shade(alb, n, vW, 0.4, 0.8);
      float pulse = 0.65 + 0.35 * sin(uTime * 2.6);
      float lit = vS.x * mix(1., pulse, vS.y);
      col += vL * vE * lit * 2.2;
      col = fogged(col, vW);
      gl_FragColor = vec4(col, 1.);
      ${END}
    }`,
    { side: DoubleSide },
  );
}

// ---------------------------------------------------------------- light: flames, beacons, rays, ribbons (additive)
export function flameMaterial(sh: Shared) {
  return mat(
    sh,
    {},
    /* glsl */ `
    attribute vec3 aState; // x = strength 0..1, y = seed
    varying vec2 vUv; varying float vK; varying float vSeed; varying vec3 vW;
    void main() {
      vUv = uv; vK = aState.x; vSeed = aState.y;
      vec4 c = instanceMatrix * vec4(0., 0., 0., 1.);
      vec4 wc = modelMatrix * c;
      float s = length(instanceMatrix[0].xyz);
      vec3 camR = vec3(viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x);
      vec3 wp = wc.xyz + camR * position.x * s + vec3(0., 1., 0.) * position.y * s;
      vW = wp;
      gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    }`,
    /* glsl */ `
    ${COMMON}
    varying vec2 vUv; varying float vK; varying float vSeed; varying vec3 vW;
    void main() {
      vec2 p = vUv - vec2(0.5, 0.);
      float t = uTime * 2.2 + vSeed * 10.;
      float n = fbm2(vec2(p.x * 3., vUv.y * 2.2 - t));
      float w = (1. - vUv.y) * 0.42 * (0.75 + 0.5 * n);
      float body = smoothstep(w, w * 0.25, abs(p.x + (n - 0.5) * 0.25 * vUv.y));
      body *= smoothstep(0.0, 0.08, vUv.y) * (1. - smoothstep(0.35, 0.95 - n * 0.2, vUv.y));
      vec3 hot = vec3(1.0, 0.92, 0.7), warm = vec3(0.89, 0.55, 0.14), deep = vec3(0.75, 0.22, 0.05);
      vec3 c = mix(deep, warm, smoothstep(0., 0.5, body));
      c = mix(c, hot, smoothstep(0.6, 1., body));
      float a = body * vK;
      gl_FragColor = vec4(c * a * 2.6, a);
      ${END}
    }`,
    { transparent: true, depthWrite: false, blending: AdditiveBlending },
  );
}

/** A soft vertical column of light and a ring on the ground: marks the next stop. */
export function beaconMaterial(sh: Shared) {
  return mat(
    sh,
    { uCol: { value: null }, uK: { value: 1 } },
    /* glsl */ `
    varying vec2 vUv; varying vec3 vW;
    void main() {
      vUv = uv;
      vec4 c = modelMatrix * vec4(0., 0., 0., 1.);
      vec3 camR = normalize(vec3(viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x));
      float sx = length(modelMatrix[0].xyz), sy = length(modelMatrix[1].xyz);
      vec3 wp = c.xyz + camR * position.x * sx + vec3(0., 1., 0.) * position.y * sy;
      vW = wp;
      gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    }`,
    /* glsl */ `
    ${COMMON}
    uniform vec3 uCol; uniform float uK;
    varying vec2 vUv; varying vec3 vW;
    void main() {
      float x = abs(vUv.x - 0.5) * 2.;
      float core = exp(-x * x * 14.) * 0.9 + exp(-x * x * 3.) * 0.35;
      float y = vUv.y;
      float fall = (1. - smoothstep(0.0, 1.0, y)) * smoothstep(0.0, 0.04, y);
      float shimmer = 0.75 + 0.25 * sin(y * 18. - uTime * 3.) * sin(uTime * 1.3);
      float a = core * fall * shimmer * uK;
      gl_FragColor = vec4(uCol * a * 1.6, a);
      ${END}
    }`,
    { transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide },
  );
}
export function ringMaterial(sh: Shared) {
  return mat(
    sh,
    { uCol: { value: null }, uK: { value: 1 } },
    /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    /* glsl */ `
    ${COMMON}
    uniform vec3 uCol; uniform float uK;
    varying vec2 vUv;
    void main() {
      float r = length(vUv - 0.5) * 2.;
      float t = fract(uTime * 0.45);
      float wave = smoothstep(0.08, 0., abs(r - t)) * (1. - t);
      float halo = exp(-r * r * 5.) * 0.55;
      float a = (wave * 0.8 + halo) * uK * (1. - smoothstep(0.92, 1., r));
      gl_FragColor = vec4(uCol * a * 1.4, a);
      ${END}
    }`,
    { transparent: true, depthWrite: false, blending: AdditiveBlending },
  );
}

/** God rays: long soft planes angled from the sun, additive. */
export function rayMaterial(sh: Shared) {
  return mat(
    sh,
    {},
    /* glsl */ `varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    /* glsl */ `
    ${COMMON}
    varying vec2 vUv; varying vec3 vW;
    void main() {
      float x = vUv.x;
      float stripes = 0.;
      stripes += smoothstep(0.5, 1., vnoise(vec2(x * 9., uTime * 0.05)));
      stripes += smoothstep(0.55, 1., vnoise(vec2(x * 23. + 4., uTime * 0.07))) * 0.6;
      float a = stripes * smoothstep(0., 0.35, vUv.y) * (1. - smoothstep(0.55, 1., vUv.y)) * smoothstep(0., 0.2, x) * (1. - smoothstep(0.8, 1., x));
      float d = length(vW - uCam);
      a *= smoothstep(4., 18., d) * 0.16 * (1. - uStars * 0.85);
      gl_FragColor = vec4(uSun * a, a);
      ${END}
    }`,
    { transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide },
  );
}

/** Cloth: banners on poles and long ribbons in the air. Soft translucency when back-lit. */
export function clothMaterial(sh: Shared, ribbon = false) {
  return mat(
    sh,
    {},
    /* glsl */ `
    attribute vec3 aState; // x seed, y length scale, z glow
    varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vG;
    void main() {
      vUv = uv; vG = aState.z;
      float s = aState.x;
      vec3 p = position;
      float u = uv.x; // 0 at the pole, 1 at the free end
      float t = uTime * ${ribbon ? "0.9" : "2.1"} + s * 6.28;
      p.z += sin(u * 5. - t) * 0.18 * u + sin(u * 11. - t * 1.7) * 0.05 * u;
      p.y += sin(u * 3.2 - t * 0.7) * 0.08 * u - u * u * 0.08;
      vec4 lp = instanceMatrix * vec4(p, 1.);
      vec4 w = modelMatrix * lp;
      ${ribbon ? "w.y += sin(uTime * 0.4 + s * 9.) * 0.6; w.x += sin(uTime * 0.23 + s * 4.) * 1.2;" : ""}
      vW = w.xyz;
      vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * vec3(0., 0., 1.) + vec3(0., 0., cos(u * 5. - t) * 0.4));
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
    /* glsl */ `
    ${COMMON}
    varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vG;
    void main() {
      vec3 n = normalize(vN);
      if (!gl_FrontFacing) n = -n;
      vec3 v = normalize(uCam - vW);
      vec3 cloth = vec3(0.86, 0.66, 0.5);
      ${ribbon ? "cloth = vec3(0.95, 0.82, 0.6);" : ""}
      float hem = smoothstep(0.82, 0.9, abs(vUv.y - 0.5) * 2.);
      vec3 alb = mix(cloth, vec3(0.894, 0.682, 0.212), hem * 0.85);
      vec3 col = shade(alb, n, vW, 0.6, 0.4);
      // light through the fabric when the sun is behind it
      float tr = pow(max(dot(-v, uSunDir), 0.), 3.);
      col += uSun * alb * tr * 0.6;
      col += vec3(0.894, 0.682, 0.212) * vG * 1.4;
      float a = 1.;
      ${ribbon ? "a = smoothstep(0., 0.15, vUv.x) * (1. - smoothstep(0.6, 1., vUv.x)) * smoothstep(0., 0.35, vUv.y) * (1. - smoothstep(0.65, 1., vUv.y)) * 0.7; col *= 1.15;" : ""}
      col = fogged(col, vW);
      gl_FragColor = vec4(col, a);
      ${END}
    }`,
    { side: DoubleSide, transparent: ribbon, depthWrite: !ribbon },
  );
}

/** Points that glow: embers over fires, fireflies at night, motes of light in the air. */
export function moteMaterial(sh: Shared, mode: "ember" | "firefly" | "mote") {
  return mat(
    sh,
    { uPx: { value: 1 } },
    /* glsl */ `
    attribute vec4 aSeed; // x,y,z random, w lifetime offset
    uniform float uPx;
    varying float vA; varying vec3 vC;
    void main() {
      vec3 p = position;
      float t = uTime;
      ${
        mode === "ember"
          ? "float life = fract(t * (0.35 + aSeed.x * 0.3) + aSeed.w); p += vec3((aSeed.y - .5) * 0.5 + sin(t * 3. + aSeed.z * 9.) * 0.08 * life, life * 1.8, (aSeed.z - .5) * 0.5); vA = (1. - life) * smoothstep(0., .1, life); vC = mix(vec3(1., .75, .3), vec3(1., .35, .08), life);"
          : mode === "firefly"
            ? "p += vec3(sin(t * .5 + aSeed.x * 20.) * 1.2, sin(t * .7 + aSeed.y * 20.) * .4, cos(t * .4 + aSeed.z * 20.) * 1.2); vA = smoothstep(.2, 1., sin(t * (1. + aSeed.w * 2.) + aSeed.x * 30.)) ; vC = vec3(.72, 1., .55);"
            : "float life = fract(t * 0.03 + aSeed.w); p += vec3(sin(t * .2 + aSeed.x * 20.) * 2., life * 6., cos(t * .15 + aSeed.z * 20.) * 2.); vA = sin(life * 3.14159) * 0.5; vC = vec3(1., .9, .7);"
      }
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = max(1.5, uPx * ${mode === "mote" ? "0.07" : mode === "ember" ? "0.06" : "0.1"} / -mv.z);
    }`,
    /* glsl */ `
    ${COMMON}
    varying float vA; varying vec3 vC;
    void main() {
      vec2 p = gl_PointCoord - .5;
      float d = length(p);
      float a = smoothstep(.5, 0., d);
      a = a * a * vA;
      ${mode === "firefly" ? "a *= uStars * 0.9 + 0.1;" : mode === "mote" ? "a *= 0.6;" : ""}
      gl_FragColor = vec4(vC * a * 1.8, a);
      ${END}
    }`,
    { transparent: true, depthWrite: false, blending: AdditiveBlending },
  );
}

/** Mist: soft noise on big planes, for the veil over locked lands and banks on the water. */
export function mistMaterial(sh: Shared, k = 1) {
  return mat(
    sh,
    { uK: { value: k } },
    /* glsl */ `varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    /* glsl */ `
    ${COMMON}
    uniform float uK;
    varying vec2 vUv; varying vec3 vW;
    void main() {
      float n = fbm2(vW.xz * 0.06 + vW.y * 0.05 + vec2(uTime * 0.01, uTime * 0.006));
      n = n * 0.6 + fbm2(vW.xy * 0.08 - uTime * 0.008) * 0.4;
      float edge = smoothstep(0., 0.25, vUv.x) * (1. - smoothstep(0.75, 1., vUv.x)) * smoothstep(0., 0.3, vUv.y) * (1. - smoothstep(0.6, 1., vUv.y));
      float a = smoothstep(0.3, 0.75, n) * edge * uK;
      vec3 vd = normalize(vW - uCam);
      vec3 c = skyColor(normalize(vec3(vd.x, 0.05, vd.z))) * 1.04 + uSun * 0.06;
      float near = smoothstep(2., 14., length(vW - uCam));
      gl_FragColor = vec4(c, a * near);
      ${END}
    }`,
    { transparent: true, depthWrite: false, side: DoubleSide, blending: NormalBlending },
  );
}

/** Birds: a soft V that flaps; instanced, circling over the water. */
export function birdMaterial(sh: Shared) {
  return mat(
    sh,
    {},
    /* glsl */ `
    attribute vec4 aSeed;
    varying vec3 vW;
    void main() {
      float t = uTime * (0.18 + aSeed.x * 0.06) + aSeed.y * 6.28;
      float R = 10. + aSeed.z * 14.;
      vec3 c = vec3(-24. + cos(t) * R, 9. + aSeed.w * 6. + sin(t * 2.) * 0.6, -40. + sin(t) * R * 0.6);
      vec3 fwd = normalize(vec3(-sin(t), 0., cos(t) * 0.6));
      vec3 side = normalize(cross(vec3(0., 1., 0.), fwd));
      vec3 p = position;
      float flap = sin(uTime * 7. + aSeed.y * 30.) * 0.5;
      float span = abs(p.x);
      vec3 wp = c + side * p.x * 0.45 + fwd * p.z * 0.45 + vec3(0., 1., 0.) * (span * flap * 0.45 + p.y);
      vW = wp;
      gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    }`,
    /* glsl */ `
    ${COMMON}
    varying vec3 vW;
    void main() {
      vec3 col = mix(uZenith, vec3(0.08, 0.07, 0.15), 0.6) + uSun * 0.05;
      col = fogged(col, vW);
      gl_FragColor = vec4(col, 1.);
      ${END}
    }`,
    { side: DoubleSide },
  );
}

/** Far lands: silhouettes in haze, lit by the sky only. */
export function farMaterial(sh: Shared) {
  return mat(
    sh,
    { uTint: { value: null }, uGlow: { value: 0 } },
    /* glsl */ `
    attribute vec3 color;
    varying vec3 vW; varying vec3 vN; varying vec3 vC;
    void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = color; gl_Position = projectionMatrix * viewMatrix * w; }`,
    /* glsl */ `
    ${COMMON}
    varying vec3 vW; varying vec3 vN; varying vec3 vC;
    void main() {
      vec3 n = normalize(vN);
      vec3 col = shade(vC, n, vW, 0.5, 1.2);
      vec3 vd = normalize(vW - uCam);
      float d = length(vW - uCam);
      float f = clamp(d / 1000., 0., 0.8) + (1. - smoothstep(0., 40., vW.y)) * 0.15;
      col = mix(col, skyColor(normalize(vec3(vd.x, max(vd.y, 0.) * 0.5 + 0.02, vd.z))), clamp(f, 0., 0.9));
      gl_FragColor = vec4(col, 1.);
      ${END}
    }`,
  );
}
