import { create } from "zustand";
import type { Tier } from "@/lib/device";

export interface Pointer {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface SceneState {
  tier: Tier | null;
  ready: boolean;
  failed: boolean;
  activeShape: string | null;
  pointer: Pointer;
  reducedMotion: boolean;
  /** True after the first pointer move, touch or tilt sample on the hero figure. */
  interacted: boolean;
  setTier: (tier: Tier, reducedMotion?: boolean) => void;
  setReady: (ready: boolean) => void;
  setFailed: (failed: boolean) => void;
  setActiveShape: (shape: string | null) => void;
  setPointer: (pointer: Pointer) => void;
  markInteracted: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  tier: null,
  ready: false,
  failed: false,
  activeShape: null,
  pointer: { x: 0, y: 0, vx: 0, vy: 0 },
  reducedMotion: false,
  interacted: false,
  setTier: (tier, reducedMotion) =>
    set((s) => ({ tier, reducedMotion: reducedMotion ?? s.reducedMotion })),
  setReady: (ready) => set({ ready }),
  setFailed: (failed) => set({ failed }),
  setActiveShape: (activeShape) => set({ activeShape }),
  setPointer: (pointer) => set({ pointer }),
  markInteracted: () => set((s) => (s.interacted ? s : { interacted: true })),
}));

// True when a canvas should exist: the tier is known, not low, and nothing failed.
export function useSceneActive(): boolean {
  return useSceneStore((s) => s.tier !== null && s.tier !== "low" && !s.failed);
}
