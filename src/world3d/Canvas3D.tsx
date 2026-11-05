import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, HalfFloatType, NoToneMapping } from "three";
import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import type { World } from "./World";

/** Web: a WebGL canvas with bloom, ACES tone mapping and a soft vignette. */
export function Canvas3D({ world, onFrame }: { world: World; onFrame: () => void }) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0 } as any}
      dpr={[1, Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)]}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false, depth: true }}
      flat
      frameloop="always"
    >
      <Driver world={world} onFrame={onFrame} />
    </Canvas>
  );
}

function Driver({ world, onFrame }: { world: World; onFrame: () => void }) {
  const { gl, size } = useThree();
  const comp = useRef<EffectComposer | null>(null);
  useEffect(() => {
    gl.toneMapping = NoToneMapping;
    const c = new EffectComposer(gl, { frameBufferType: HalfFloatType });
    c.addPass(new RenderPass(world.scene, world.camera));
    c.addPass(
      new EffectPass(
        world.camera,
        new BloomEffect({ luminanceThreshold: 0.8, luminanceSmoothing: 0.25, intensity: 0.9, mipmapBlur: true }),
        new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
        new VignetteEffect({ darkness: 0.42, offset: 0.32 }),
      ),
    );
    comp.current = c;
    return () => {
      c.dispose();
      comp.current = null;
      gl.toneMapping = ACESFilmicToneMapping;
    };
  }, [gl, world]);
  useEffect(() => {
    world.setSize(size.width, size.height);
    comp.current?.setSize(size.width, size.height);
  }, [size.width, size.height, world]);
  useFrame((_, dt) => {
    world.update(dt);
    world.renderShadow(gl);
    if (comp.current) comp.current.render(dt);
    else gl.render(world.scene, world.camera);
    onFrame();
  }, 1);
  return null;
}

/** Can this browser draw the 3D world? */
export function canDraw3D() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
