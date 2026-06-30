"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  NormalBlending,
  OrthographicCamera,
  ShaderMaterial,
  Vector2,
  Vector4,
} from "three";
import { isSoftwareRenderer } from "@/lib/gpu";
import {
  approach,
  breezeLevel,
  SAMPLE_INTERVAL,
  SAMPLE_INTERVAL_SOFTWARE,
  stormNow,
  TRAIL_MAX,
  TRAIL_MAX_SOFTWARE,
  TRAIL_TTL,
  WIND_DAMPING,
  WIND_OMEGA,
  windTrail,
} from "@/lib/pointer-force";
import { buildStormAttributes } from "@/lib/storm-attributes";
import { useSceneStore } from "@/lib/scene-store";
import { useMarkReady } from "./ready";
import { stormFrag, stormVert, TRAIL_SLOTS } from "./shaders/storm";
import { usePointerForce } from "./usePointerForce";

export interface PixelStormProps {
  count: number;
  targets: Float32Array;
  colors: string[];
  pointSize?: number;
  /** False pauses the idle shimmer, for example while the slot is off screen. */
  animate?: boolean;
  /** CSS selector of the element the view fills. Pointer moves over it push the pixels. */
  slot?: string;
}

const WIND_RADIUS_PX = 140;
const WIND_GAIN = 0.03;
const IDLE_FPS = 30; // the idle shimmer does not need more than 30 fps
const WIND_FPS = 60; // wind feels laggy at 30
const SOFTWARE_FPS = 15;
const BREEZE_FPS = 15; // a settled breeze is slow enough for 15 fps
const BREEZE_FALL_S = 0.25; // a new sample fades the breeze out this fast, no pop

declare global {
  interface Window {
    __storm?: { frames: number; trailCount: number };
  }
}

export function PixelStorm({ count, targets, colors, pointSize = 3, animate = true, slot }: PixelStormProps) {
  const invalidate = useThree((s) => s.invalidate);
  const dpr = useThree((s) => s.viewport.dpr);
  const gl = useThree((s) => s.gl);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  // On a CPU renderer the storm holds still between redraws, and the wind runs lighter.
  const software = useMemo(() => isSoftwareRenderer(gl.getContext()), [gl]);
  const animating = animate && !reducedMotion && !software;
  useMarkReady();
  usePointerForce(slot, !reducedMotion);

  useEffect(() => {
    if (software) windTrail.configure(TRAIL_MAX_SOFTWARE, SAMPLE_INTERVAL_SOFTWARE);
    else windTrail.configure(TRAIL_MAX, SAMPLE_INTERVAL);
  }, [software]);

  const geometry = useMemo(() => {
    const a = buildStormAttributes(targets, count, colors);
    const g = new BufferGeometry();
    // three needs a position attribute for the draw count and bounds.
    g.setAttribute("position", new BufferAttribute(a.aTarget, 3));
    g.setAttribute("aTarget", new BufferAttribute(a.aTarget, 3));
    g.setAttribute("aTarget2", new BufferAttribute(a.aTarget2, 3));
    g.setAttribute("aSeed", new BufferAttribute(a.aSeed, 1));
    g.setAttribute("aColor", new BufferAttribute(a.aColor, 3));
    return g;
  }, [targets, count, colors]);

  const materialRef = useRef<ShaderMaterial>(null);
  const frames = useRef(0);
  const breeze = useRef({ level: 0, steady: false, lastT: 0 });
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uLive: { value: 0 },
    uMorph: { value: 0 },
    uPointSize: { value: pointSize },
    uDpr: { value: 1 },
    uRadius: { value: 0.25 },
    uTrail: { value: Array.from({ length: TRAIL_SLOTS }, () => new Vector4()) },
    uTrailDir: { value: Array.from({ length: TRAIL_SLOTS }, () => new Vector2()) },
    uTrailCount: { value: 0 },
    uWindGain: { value: WIND_GAIN },
    uDamping: { value: WIND_DAMPING },
    uOmega: { value: WIND_OMEGA },
    uBreeze: { value: 0 },
  }));

  useEffect(() => () => geometry.dispose(), [geometry]);

  // The view reads the slot rect inside a frame, so a scroll or resize needs one.
  useEffect(() => {
    invalidate();
    const onChange = () => invalidate();
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, [invalidate, geometry, pointSize]);

  // Drives the demand loop. Wind runs at up to 60 fps (15 on software) until
  // the trail settles 1.5 s after its last sample. Then the shimmer and the
  // fading-in breeze run at 30, and a steady breeze at 15. With nothing
  // animating, the loop stops until the next sample wakes it.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = 0;
      const windy = windTrail.count > 0 && stormNow() < windTrail.latestTime + TRAIL_TTL;
      let fps = 0;
      if (windy) fps = software ? SOFTWARE_FPS : WIND_FPS;
      else if (animating) fps = breeze.current.steady ? BREEZE_FPS : IDLE_FPS;
      if (fps === 0) {
        invalidate(); // one more frame draws the settled state
        return;
      }
      // 1 ms of slack so a 60 Hz display does not skip every other frame.
      if (now - last >= 1000 / fps - 1) {
        last = now;
        invalidate();
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    wake();
    const off = windTrail.subscribe(wake);
    return () => {
      off();
      cancelAnimationFrame(raf);
    };
  }, [animating, software, invalidate]);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms as typeof uniforms;
    const t = stormNow();
    u.uTime.value = t;
    u.uLive.value = animating ? 1 : 0;
    // Breeze eases in 2 to 3 s after the last sample and fades out fast on a new one.
    const b = breeze.current;
    const target = animating ? breezeLevel(t - windTrail.latestTime) : 0;
    b.level = target >= b.level ? target : approach(b.level, target, t - b.lastT, BREEZE_FALL_S);
    b.lastT = t;
    b.steady = target === 1 && b.level === 1;
    u.uBreeze.value = b.level;
    u.uPointSize.value = pointSize;
    u.uDpr.value = dpr;
    const cam = state.camera;
    if (cam instanceof OrthographicCamera && cam.zoom > 0) {
      u.uRadius.value = WIND_RADIUS_PX / cam.zoom;
      // Trail samples are in slot units (-1..1); the view's camera spans the slot.
      const halfW = (cam.right - cam.left) / 2 / cam.zoom;
      const halfH = (cam.top - cam.bottom) / 2 / cam.zoom;
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
    if (process.env.NEXT_PUBLIC_E2E === "1") {
      frames.current += 1;
      window.__storm = { frames: frames.current, trailCount: windTrail.count };
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={stormVert}
        fragmentShader={stormFrag}
        uniforms={uniforms}
        transparent={false}
        depthWrite={false}
        blending={NormalBlending}
      />
    </points>
  );
}
