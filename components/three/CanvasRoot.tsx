"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useSceneStore } from "@/lib/scene-store";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

export default function CanvasRoot() {
  const tier = useSceneStore((s) => s.tier);
  const failed = useSceneStore((s) => s.failed);
  const setReady = useSceneStore((s) => s.setReady);

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
        onCreated={() => setReady(true)}
      >
        <View.Port />
      </Canvas>
    </SceneErrorBoundary>
  );
}
