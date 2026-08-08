"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useSceneStore } from "@/lib/scene-store";

// A scene component calls this once. After its first drawn frame the store
// flips to ready, which fades the posters out.
export function useMarkReady(): void {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    useSceneStore.getState().setReady(true);
  });
}
