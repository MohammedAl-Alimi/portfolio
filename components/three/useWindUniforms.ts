"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { OrthographicCamera, Vector2, Vector4, type Camera, type ShaderMaterial } from "three";
import {
  approach,
  breezeLevel,
  SAMPLE_INTERVAL,
  SAMPLE_INTERVAL_SOFTWARE,
  stormNow,
  TRAIL_MAX,
  TRAIL_MAX_SOFTWARE,
  WIND_DAMPING,
  WIND_OMEGA,
  windTrail,
} from "@/lib/pointer-force";
import { TRAIL_SLOTS } from "./shaders/wind";

// A type alias, not an interface, so it fits three's uniform index signature.
export type WindUniforms = {
  uTime: { value: number };
  uRadius: { value: number };
  uTrail: { value: Vector4[] };
  uTrailDir: { value: Vector2[] };
  uTrailCount: { value: number };
  uWindGain: { value: number };
  uDamping: { value: number };
  uOmega: { value: number };
};

export function createWindUniforms(gain: number): WindUniforms {
  return {
    uTime: { value: 0 },
    uRadius: { value: 0.25 },
    uTrail: { value: Array.from({ length: TRAIL_SLOTS }, () => new Vector4()) },
    uTrailDir: { value: Array.from({ length: TRAIL_SLOTS }, () => new Vector2()) },
    uTrailCount: { value: 0 },
    uWindGain: { value: gain },
    uDamping: { value: WIND_DAMPING },
    uOmega: { value: WIND_OMEGA },
  };
}

/** Breeze state the wind hook keeps. `steady` means a settled breeze, so the cadence can drop. */
export interface Breeze {
  level: number;
  steady: boolean;
  lastT: number;
}

const WIND_RADIUS_PX = 140;
const BREEZE_FALL_S = 0.25; // a new sample fades the breeze out this fast, no pop

/** Copies the trail into the uniforms. Trail samples are in slot units (-1..1);
 * the view's ortho camera spans the slot, so its half extents convert them. */
export function packWind(u: WindUniforms, camera: Camera, t: number): void {
  u.uTime.value = t;
  if (!(camera instanceof OrthographicCamera) || !(camera.zoom > 0)) return;
  u.uRadius.value = WIND_RADIUS_PX / camera.zoom;
  const halfW = (camera.right - camera.left) / 2 / camera.zoom;
  const halfH = (camera.top - camera.bottom) / 2 / camera.zoom;
  windTrail.prune(t);
  const samples = windTrail.samples;
  const n = Math.min(samples.length, TRAIL_SLOTS);
  for (let i = 0; i < n; i++) {
    const s = samples[i];
    const slotV = u.uTrail.value[i];
    const dirV = u.uTrailDir.value[i];
    if (!s || !slotV || !dirV) continue;
    const vx = s.vx * halfW;
    const vy = s.vy * halfH;
    const speed = Math.hypot(vx, vy);
    slotV.set(s.x * halfW, s.y * halfH, s.t, speed);
    if (speed > 1e-6) dirV.set(vx / speed, vy / speed);
    else dirV.set(0, 0);
  }
  u.uTrailCount.value = n;
}

/**
 * Packs the wind uniforms every frame from the view's own camera and tracks the
 * breeze level. The breeze eases in 2 to 3 s after the last sample and fades out
 * fast on a new one. Also sizes the shared trail for software renderers.
 * Returns the breeze state; callers that draw a breeze read `level`.
 *
 * Takes the material, not the uniforms object passed to it: R3F copies each
 * uniform into the material's own object, so writes must go to `material.uniforms`.
 */
export function useWindUniforms(
  materialRef: RefObject<ShaderMaterial | null>,
  { animating, software }: { animating: boolean; software: boolean },
): RefObject<Breeze> {
  const breeze = useRef<Breeze>({ level: 0, steady: false, lastT: 0 });

  useEffect(() => {
    if (software) windTrail.configure(TRAIL_MAX_SOFTWARE, SAMPLE_INTERVAL_SOFTWARE);
    else windTrail.configure(TRAIL_MAX, SAMPLE_INTERVAL);
  }, [software]);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms as WindUniforms;
    const t = stormNow();
    const b = breeze.current;
    const target = animating ? breezeLevel(t - windTrail.latestTime) : 0;
    b.level = target >= b.level ? target : approach(b.level, target, t - b.lastT, BREEZE_FALL_S);
    b.lastT = t;
    b.steady = target === 1 && b.level === 1;
    packWind(u, state.camera, t);
  });

  return breeze;
}
