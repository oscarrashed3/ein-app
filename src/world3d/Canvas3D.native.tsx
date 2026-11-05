import { useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { ACESFilmicToneMapping } from "three";
import type { World } from "./World";

/** Native: expo-gl through react-three-fiber. No post-processing: ACES on the renderer keeps the same look, cheaper. */
export function Canvas3D({ world, onFrame }: { world: World; onFrame: () => void }) {
  return (
    <Canvas style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} flat={false} gl={{ antialias: false }} frameloop="always">
      <Driver world={world} onFrame={onFrame} />
    </Canvas>
  );
}
function Driver({ world, onFrame }: { world: World; onFrame: () => void }) {
  const { gl, size } = useThree();
  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
  }, [gl]);
  useEffect(() => world.setSize(size.width, size.height), [size.width, size.height, world]);
  useFrame((_, dt) => {
    world.update(dt);
    world.renderShadow(gl);
    gl.render(world.scene, world.camera);
    onFrame();
  }, 1);
  return null;
}
export function canDraw3D() {
  return true;
}
