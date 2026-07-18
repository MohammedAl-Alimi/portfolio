"use client";

import { useEffect } from "react";
import { getDeviceTier, readDeviceSignals, type Tier } from "@/lib/device";
import { useSceneStore } from "@/lib/scene-store";

const PROBE_FRAMES = 30;

function applyTier(tier: Tier) {
  document.documentElement.dataset.tier = tier;
  useSceneStore.getState().setTier(tier);
}

export function useTier(): Tier | null {
  const tier = useSceneStore((s) => s.tier);

  useEffect(() => {
    if (useSceneStore.getState().tier !== null) return;
    const signals = readDeviceSignals();
    const initial = getDeviceTier(signals);
    useSceneStore.getState().setTier(initial, signals.reducedMotion);
    document.documentElement.dataset.tier = initial;
    if (signals.reducedMotion) document.documentElement.dataset.reducedMotion = "true";
    if (initial !== "high") return;

    // Measure 30 frames once, then downgrade high to mid if the device is slow.
    let raf = 0;
    let last = 0;
    let count = 0;
    let total = 0;
    const step = (now: number) => {
      if (last !== 0) {
        total += now - last;
        count += 1;
      }
      last = now;
      if (count < PROBE_FRAMES) {
        raf = requestAnimationFrame(step);
        return;
      }
      const next = getDeviceTier({ ...signals, frameMs: total / count });
      if (next === "mid") applyTier(next);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return tier;
}
