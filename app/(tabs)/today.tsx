import { useMemo } from "react";
import { useProgress } from "../../src/state/progress";
import { SimpleMap } from "../../src/world/SimpleMap";
import Journey3D from "../../src/world3d/Journey3D";
import { canDraw3D } from "../../src/world3d/Canvas3D";

/**
 * Journey: the 3D world by default. "Simple map" in Profile (or a device without WebGL) shows the flat map.
 */
export default function Journey() {
  const { s } = useProgress();
  const ok = useMemo(() => canDraw3D(), []);
  return s.map === "simple" || !ok ? <SimpleMap /> : <Journey3D />;
}
