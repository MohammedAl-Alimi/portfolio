"use client";

import dynamic from "next/dynamic";
import { useSceneStore } from "@/lib/scene-store";
import { useTier } from "@/lib/use-tier";

// The 3D chunk is only requested once the tier says the canvas is wanted.
const CanvasRoot = dynamic(() => import("./CanvasRoot"), { ssr: false });

export function CanvasRootLoader() {
  const tier = useTier();
  const failed = useSceneStore((s) => s.failed);
  if (tier === null || tier === "low" || failed) return null;
  return <CanvasRoot />;
}
