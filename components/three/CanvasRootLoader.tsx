"use client";

import dynamic from "next/dynamic";
import { useSceneActive } from "@/lib/scene-store";
import { useTier } from "@/lib/use-tier";

// The 3D chunk is only requested once the tier says the canvas is wanted.
const CanvasRoot = dynamic(() => import("./CanvasRoot"), { ssr: false });

export function CanvasRootLoader() {
  useTier();
  const active = useSceneActive();
  if (!active) return null;
  return <CanvasRoot />;
}
