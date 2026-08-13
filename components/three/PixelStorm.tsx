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
} from "three";
import { buildStormAttributes } from "@/lib/storm-attributes";
import { useSceneStore } from "@/lib/scene-store";
import { useMarkReady } from "./ready";
import { stormFrag, stormVert } from "./shaders/storm";

export interface PixelStormProps {
  count: number;
  targets: Float32Array;
  colors: string[];
  pointSize?: number;
  /** False pauses the idle shimmer, for example while the slot is off screen. */
  animate?: boolean;
}

const WIND_RADIUS_PX = 140;
const FRAME_MS = 1000 / 30; // the idle shimmer does not need more than 30 fps

export function PixelStorm({ count, targets, colors, pointSize = 3, animate = true }: PixelStormProps) {
  const invalidate = useThree((s) => s.invalidate);
  const dpr = useThree((s) => s.viewport.dpr);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const animating = animate && !reducedMotion;
  useMarkReady();

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
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uPointSize: { value: pointSize },
    uDpr: { value: 1 },
    uPointer: { value: new Vector2(0, 0) },
    uPointerVel: { value: new Vector2(0, 0) },
    uRadius: { value: 0.25 },
    uStiffness: { value: 0.12 },
    uDamping: { value: 0.85 },
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

  // Drive the demand loop at most 30 times a second while the shimmer runs.
  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last >= FRAME_MS) {
        last = now;
        invalidate();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animating, invalidate]);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    if (animating && u.uTime) u.uTime.value = state.clock.elapsedTime;
    if (u.uPointSize) u.uPointSize.value = pointSize;
    if (u.uDpr) u.uDpr.value = dpr;
    const cam = state.camera;
    if (u.uRadius && cam instanceof OrthographicCamera && cam.zoom > 0) {
      u.uRadius.value = WIND_RADIUS_PX / cam.zoom;
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
