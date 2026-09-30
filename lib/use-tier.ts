"use client";

import { useEffect } from "react";
import { getDeviceTier, readDeviceSignals, tierAfterProbe, type Tier } from "@/lib/device";
import { useSceneStore } from "@/lib/scene-store";

const PROBE_SAMPLES = 35; // 5 warm-up frames are dropped, 30 are measured
const IDLE_FALLBACK_MS = 1500;

export function useTier(): Tier | null {
  const tier = useSceneStore((s) => s.tier);

  useEffect(() => {
    if (useSceneStore.getState().tier !== null) return;
    const signals = readDeviceSignals();
    const initial = getDeviceTier(signals);
    // Set before the tier, so anything waiting on the tier sees both.
    useSceneStore.getState().setSoftware(signals.software === true);
    useSceneStore.getState().setTier(initial, signals.reducedMotion);
    document.documentElement.dataset.tier = initial;
    if (signals.reducedMotion) document.documentElement.dataset.reducedMotion = "true";
    if (initial !== "high") return;

    let raf = 0;
    let started = false;
    let cancelled = false;
    const samples: number[] = [];
    let last = 0;

    const step = (now: number) => {
      if (cancelled || document.hidden) return; // a hidden tab gives no real timing
      if (last !== 0) samples.push(now - last);
      last = now;
      if (samples.length < PROBE_SAMPLES) {
        raf = requestAnimationFrame(step);
        return;
      }
      if (tierAfterProbe(signals, samples) === "mid") {
        document.documentElement.dataset.tier = "mid";
        useSceneStore.getState().setTier("mid");
      }
    };
    const start = () => {
      if (started || cancelled) return;
      started = true;
      if (document.hidden) return;
      raf = requestAnimationFrame(step);
    };

    // Start once the scene is ready, or when the browser is idle, whichever is first.
    const unsubscribe = useSceneStore.subscribe((s) => {
      if (s.ready) start();
    });
    if (useSceneStore.getState().ready) start();
    let idle = 0;
    let timer = 0;
    if (typeof requestIdleCallback === "function") {
      idle = requestIdleCallback(start, { timeout: IDLE_FALLBACK_MS });
    } else {
      timer = window.setTimeout(start, IDLE_FALLBACK_MS);
    }

    return () => {
      cancelled = true;
      unsubscribe();
      cancelAnimationFrame(raf);
      if (idle && typeof cancelIdleCallback === "function") cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  return tier;
}
