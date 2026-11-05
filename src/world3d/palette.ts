import { Color, Matrix4, Vector3 } from "three";

/**
 * Light for each time of day. Colours are sRGB hex (converted to linear by three).
 * The brand colours never paint surfaces: they only appear as light (lanterns, fires, gate, summit).
 */
export type Tod = "dawn" | "day" | "dusk" | "night";
export type Light = {
  sunDir: [number, number, number];
  sun: string; sunK: number;
  zenith: string; mid: string; horizon: string; below: string;
  skyAmb: string; groundAmb: string; ambK: number;
  fogNear: number; fogFar: number;
  waterDeep: string; waterShallow: string;
  sand: string; sandShade: string; grass: string; rock: string;
  stars: number; exposure: number;
  fire: number; // how much the fires and lanterns light the world
};

export const LIGHTS: Record<Tod, Light> = {
  dawn: {
    sunDir: [-0.9, 0.24, -0.36], sun: "#FFB88A", sunK: 2.6,
    zenith: "#6475B0", mid: "#D99AA6", horizon: "#FFC69C", below: "#E2A894",
    skyAmb: "#8C9AD0", groundAmb: "#D69A86", ambK: 0.55,
    fogNear: 60, fogFar: 420,
    waterDeep: "#1C5572", waterShallow: "#56C2BC",
    sand: "#F4C79C", sandShade: "#B98079", grass: "#86965C", rock: "#A88A86",
    stars: 0.05, exposure: 1.0, fire: 0.6,
  },
  day: {
    sunDir: [-0.6, 0.62, -0.3], sun: "#FFEFD6", sunK: 1.65,
    zenith: "#4F86C2", mid: "#94BEDD", horizon: "#D6E6EA", below: "#C9D9D6",
    skyAmb: "#9DBCE0", groundAmb: "#D9C29C", ambK: 0.5,
    fogNear: 60, fogFar: 440,
    waterDeep: "#1F6B8A", waterShallow: "#6ED8CC",
    sand: "#E8BF8E", sandShade: "#AE8270", grass: "#7E9A58", rock: "#A08F86",
    stars: 0, exposure: 0.92, fire: 0.3,
  },
  dusk: {
    sunDir: [0.85, 0.16, -0.5], sun: "#FF9A68", sunK: 2.3,
    zenith: "#3E3F7E", mid: "#B4709A", horizon: "#FFAF84", below: "#C98A8E",
    skyAmb: "#8D86C2", groundAmb: "#D49274", ambK: 0.5,
    fogNear: 50, fogFar: 380,
    waterDeep: "#2A4E7A", waterShallow: "#7DB8C6",
    sand: "#EDC6A6", sandShade: "#A87C86", grass: "#8A8F62", rock: "#A88B8C",
    stars: 0.25, exposure: 1.0, fire: 0.9,
  },
  night: {
    sunDir: [-0.55, 0.5, -0.66], sun: "#B9C6F0", sunK: 0.7,
    zenith: "#03041E", mid: "#0B1240", horizon: "#22305E", below: "#0A1036",
    skyAmb: "#3A447E", groundAmb: "#1C1E44", ambK: 0.42,
    fogNear: 40, fogFar: 320,
    waterDeep: "#06122E", waterShallow: "#1B4A62",
    sand: "#9FA2C2", sandShade: "#454A78", grass: "#55627A", rock: "#626486",
    stars: 1, exposure: 1.1, fire: 1.7,
  },
};

/** Shared uniforms: every material points at the same objects, so changing the time of day is one write. */
export function makeShared() {
  return {
    uTime: { value: 0 },
    uSunDir: { value: new Vector3(0, 1, 0) },
    uSun: { value: new Color() },
    uZenith: { value: new Color() },
    uMid: { value: new Color() },
    uHorizon: { value: new Color() },
    uBelow: { value: new Color() },
    uSkyAmb: { value: new Color() },
    uGroundAmb: { value: new Color() },
    uFog: { value: new Vector3(30, 260, 0) },
    uStars: { value: 0 },
    uFireK: { value: 1 },
    uCam: { value: new Vector3() },
    // up to 8 point glows (fires, lanterns, gate): xyz + radius, and colour * intensity
    uLP: { value: Array.from({ length: 8 }, () => new Vector3(0, -99, 0)) },
    uLR: { value: new Array(8).fill(0) as number[] },
    uLC: { value: Array.from({ length: 8 }, () => new Color(0, 0, 0)) },
    uShadowMap: { value: null as any },
    uShadowMat: { value: new Matrix4() },
    uShadowOn: { value: 0 },
  };
}
export type Shared = ReturnType<typeof makeShared>;

export function applyLight(u: Shared, L: Light) {
  u.uSunDir.value.set(...L.sunDir).normalize();
  u.uSun.value.set(L.sun).multiplyScalar(L.sunK);
  u.uZenith.value.set(L.zenith);
  u.uMid.value.set(L.mid);
  u.uHorizon.value.set(L.horizon);
  u.uBelow.value.set(L.below);
  u.uSkyAmb.value.set(L.skyAmb).multiplyScalar(L.ambK);
  u.uGroundAmb.value.set(L.groundAmb).multiplyScalar(L.ambK);
  u.uFog.value.set(L.fogNear, L.fogFar, 0);
  u.uStars.value = L.stars;
  u.uFireK.value = L.fire;
}
