"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useSceneStore } from "@/lib/scene-store";
import { ReadyProbe } from "./ReadyProbe";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

export default function CanvasRoot() {
  const tier = useSceneStore((s) => s.tier);
  const failed = useSceneStore((s) => s.failed);

  if (tier === null || tier === "low" || failed) return null;

  return (
    <SceneErrorBoundary>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        eventSource={document.body}
        eventPrefix="client"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      >
        <ReadyProbe />
        <View.Port />
      </Canvas>
    </SceneErrorBoundary>
  );
}
