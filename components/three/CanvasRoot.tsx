"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useSceneActive, useSceneStore } from "@/lib/scene-store";
import { ReadyProbe } from "./ReadyProbe";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

export default function CanvasRoot() {
  const active = useSceneActive();
  if (!active) return null;

  return (
    <SceneErrorBoundary>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        eventSource={document.body}
        eventPrefix="client"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
        onCreated={({ gl }) => {
          // A lost WebGL context cannot be drawn to, so fall back to the posters.
          gl.domElement.addEventListener("webglcontextlost", () => {
            useSceneStore.getState().setFailed(true);
          });
        }}
      >
        <ReadyProbe />
        <View.Port />
      </Canvas>
    </SceneErrorBoundary>
  );
}
