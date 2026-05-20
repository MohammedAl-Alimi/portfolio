// Settings behind the lab's figure sandbox (components/lab/FigureSandbox.tsx).
// Pure code, unit tested in tests/unit/figure-sandbox.test.ts.
import type { Tier } from "./device";
import { FULL_COUNT } from "./figure-fx";

export interface SandboxSettings {
  /** Rotation speed in rad/s. */
  yawSpeed: number;
  /** Multiplier on the glitch cadence; 0 turns glitches off. */
  glitchRate: number;
  scanline: boolean;
  windGain: number;
}

/** Same values as the hero figure (components/three/FigureCloud.tsx). */
export const SANDBOX_DEFAULTS: SandboxSettings = { yawSpeed: 0.15, glitchRate: 1, scanline: true, windGain: 0.03 };

/**
 * Reduced motion: nothing moves. Today reduced motion also drops the tier to low
 * (lib/device.ts), so the poster shows and these are only the disabled controls' values.
 */
export const SANDBOX_STILL: SandboxSettings = { yawSpeed: 0, glitchRate: 0, scanline: false, windGain: 0.03 };

export const MIN_COUNT = 10000;
export const MID_COUNT = 30000;

/** Most points the tier may draw: the full figure on high, the hero's mid count otherwise. */
export function countCap(tier: Tier | null): number {
  return tier === "high" ? FULL_COUNT : MID_COUNT;
}

/** The count to load: the visitor's pick, or the cap when there is none, kept inside the slider's range. */
export function resolveCount(picked: number | null, cap: number): number {
  if (picked === null) return cap;
  return Math.min(cap, Math.max(MIN_COUNT, Math.round(picked)));
}
