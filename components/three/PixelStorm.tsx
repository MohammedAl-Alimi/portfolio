"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry, NormalBlending, ShaderMaterial } from "three";
import { isSoftwareRenderer } from "@/lib/gpu";
import { stormNow, windTrail } from "@/lib/pointer-force";
import { buildStormAttributes } from "@/lib/storm-attributes";
import { useSceneStore } from "@/lib/scene-store";
import { useMarkReady } from "./ready";
import { stormFrag, stormVert } from "./shaders/storm";
import { usePointerForce } from "./usePointerForce";
import { useWindCadence } from "./useWindCadence";
import { createWindUniforms, useWindUniforms, type WindUniforms } from "./useWindUniforms";

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

const WIND_GAIN = 0.03;

declare global {
  interface Window {
    __storm?: { frames: number; trailCount: number };
  }
}

type StormUniforms = WindUniforms & {
  uLive: { value: number };
  uMorph: { value: number };
  uPointSize: { value: number };
  uDpr: { value: number };
  uBreeze: { value: number };
};

export function PixelStorm({ count, targets, colors, pointSize = 3, animate = true, slot }: PixelStormProps) {
  const dpr = useThree((s) => s.viewport.dpr);
  const gl = useThree((s) => s.gl);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  // On a CPU renderer the storm holds still between redraws, and the wind runs lighter.
  const software = useMemo(() => isSoftwareRenderer(gl.getContext()), [gl]);
  const animating = animate && !reducedMotion && !software;
  useMarkReady();
  usePointerForce(slot, !reducedMotion);

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
  const [uniforms] = useState<StormUniforms>(() => ({
    ...createWindUniforms(WIND_GAIN),
    uLive: { value: 0 },
    uMorph: { value: 0 },
    uPointSize: { value: pointSize },
    uDpr: { value: 1 },
    uBreeze: { value: 0 },
  }));

  useEffect(() => () => geometry.dispose(), [geometry]);

  const breeze = useWindUniforms(materialRef, { animating, software });
  useWindCadence({ animating, software, steadyRef: breeze });

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    // R3F copies the uniforms into the material, so write to the material's own.
    const u = mat.uniforms as StormUniforms;
    u.uTime.value = stormNow();
    u.uLive.value = animating ? 1 : 0;
    u.uBreeze.value = breeze.current.level;
    u.uPointSize.value = pointSize;
    u.uDpr.value = dpr;
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
