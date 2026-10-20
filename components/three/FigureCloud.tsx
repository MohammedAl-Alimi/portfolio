"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry, NormalBlending, Vector2, type ShaderMaterial } from "three";
import type { Figure } from "@/lib/figure";
import {
  buildFigureAttributes,
  figureZoom,
  GLITCH_MS,
  glitchBands,
  nextGlitchDelay,
  orbitFor,
  pointScaleFor,
  scanY,
  wrapAngle,
} from "@/lib/figure-fx";
import { isSoftwareRenderer } from "@/lib/gpu";
import { stormNow, windTrail } from "@/lib/pointer-force";
import { mulberry32 } from "@/lib/rng";
import { useSceneStore } from "@/lib/scene-store";
import { subscribeScroll } from "@/lib/scroll";
import type { SlotSize } from "@/lib/use-slot";
import { useMarkReady } from "./ready";
import { figureFrag, figureVert } from "./shaders/figure";
import { usePointerForce } from "./usePointerForce";
import { useWindCadence } from "./useWindCadence";
import { createWindUniforms, useWindUniforms, type WindUniforms } from "./useWindUniforms";

export interface FigureCloudProps {
  figure: Figure;
  /** Size of the slot the view fills, in CSS px. */
  size: SlotSize;
  /** False stops the rotation, for example while the slot is off screen. */
  visible?: boolean;
  /** CSS selector of the slot. Pointer moves over it push the points. */
  slot?: string;
  /** CSS selector of the section whose scroll-out orbits the camera (0 to 0.52 rad). */
  orbitTrack?: string;
}

const YAW_SPEED = 0.15; // rad/s
const MAX_DT = 0.1; // a long gap (tab hidden, slot off screen) does not jump the rotation
const WIND_GAIN = 0.03;

export interface FigureProbe {
  frames: number;
  trailCount: number;
  yaw: number;
  /** Camera orbit from scrolling, in rad. */
  orbit: number;
  /** True on a CPU renderer, where the figure holds still. */
  software: boolean;
  /** Starts a glitch now, held for `ms` (default 120). */
  glitch: (ms?: number) => void;
}

declare global {
  interface Window {
    __figure?: FigureProbe;
  }
}

type FigureUniforms = WindUniforms & {
  uYaw: { value: number };
  uOrbit: { value: number };
  uFog: { value: number };
  uScanY: { value: number };
  uGlitch: { value: number };
  uGlitchSeed: { value: number };
  uGlitchBands: { value: Vector2[] };
  uPointScale: { value: number };
  uDpr: { value: number };
  uJitter: { value: number };
};

// Test-only: CI renders on the CPU, where the figure holds still. `?motion=force`
// lets an e2e test watch the rotation there. Production builds inline "0" and drop it.
function forceMotion(): boolean {
  return (
    process.env.NEXT_PUBLIC_E2E === "1" && new URLSearchParams(window.location.search).get("motion") === "force"
  );
}

export function buildFigureGeometry(figure: Figure): BufferGeometry {
  const a = buildFigureAttributes(figure);
  const g = new BufferGeometry();
  // three needs a position attribute for the draw count and bounds.
  g.setAttribute("position", new BufferAttribute(a.aPos, 3));
  g.setAttribute("aPos", new BufferAttribute(a.aPos, 3));
  g.setAttribute("aLum", new BufferAttribute(a.aLum, 1));
  g.setAttribute("aSeed", new BufferAttribute(a.aSeed, 1));
  g.setAttribute("aKind", new BufferAttribute(a.aKind, 1));
  return g;
}

export function FigureCloud({ figure, size, visible = true, slot, orbitTrack }: FigureCloudProps) {
  const dpr = useThree((s) => s.viewport.dpr);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  // On a CPU renderer the figure holds still between redraws, and the wind runs lighter.
  const software = useMemo(() => isSoftwareRenderer(gl.getContext()) && !forceMotion(), [gl]);
  const animating = visible && !reducedMotion && !software;
  useMarkReady();
  usePointerForce(slot, !reducedMotion);

  const zoom = figureZoom(size.width, size.height);
  const geometry = useMemo(() => buildFigureGeometry(figure), [figure]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const [uniforms] = useState<FigureUniforms>(() => ({
    ...createWindUniforms(WIND_GAIN),
    uYaw: { value: 0 },
    uOrbit: { value: 0 },
    uFog: { value: 1 },
    uScanY: { value: -1.2 },
    uGlitch: { value: 0 },
    uGlitchSeed: { value: 0 },
    uGlitchBands: { value: [new Vector2(), new Vector2(), new Vector2()] },
    uPointScale: { value: 1 },
    uDpr: { value: 1 },
    uJitter: { value: 1 },
  }));
  const materialRef = useRef<ShaderMaterial>(null);

  // The rotation never settles, so there is no steady state: 30 fps while
  // visible, 60 while the wind blows, stopped off screen.
  useWindUniforms(materialRef, { animating, software });
  useWindCadence({ animating, software });

  const clock = useRef({ lastT: -1, scanT: 0, frames: 0 });
  // Seeded from the clock on the first frame, so every visit glitches on its own schedule.
  const glitch = useRef<{ rand: (() => number) | null; nextAt: number; endAt: number; holdMs: number }>({
    rand: null,
    nextAt: -1,
    endAt: 0,
    holdMs: GLITCH_MS,
  });

  // Scroll orbits the camera. The demand loop draws one frame per change, never more.
  useEffect(() => {
    const track = orbitTrack ? document.querySelector(orbitTrack) : null;
    if (!track) return;
    return subscribeScroll(({ y }) => {
      const mat = materialRef.current;
      if (!mat) return;
      // The section's bottom edge in document coordinates, re-read so layout changes count.
      const end = track.getBoundingClientRect().bottom + window.scrollY;
      const orbit = orbitFor(y, end);
      const u = mat.uniforms as FigureUniforms;
      if (u.uOrbit.value === orbit) return;
      u.uOrbit.value = orbit;
      invalidate();
    });
  }, [orbitTrack, invalidate]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_E2E !== "1") return;
    return () => {
      delete window.__figure;
    };
  }, []);

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    // R3F copies the uniforms into the material, so write to the material's own.
    const u = mat.uniforms as FigureUniforms;
    const t = stormNow();
    const c = clock.current;
    const dt = c.lastT < 0 ? 0 : Math.min(MAX_DT, Math.max(0, t - c.lastT));
    c.lastT = t;
    if (animating) {
      u.uYaw.value = wrapAngle(u.uYaw.value + YAW_SPEED * dt);
      c.scanT += dt;
    }
    u.uScanY.value = scanY(c.scanT);

    const g = glitch.current;
    const rand = (g.rand ??= mulberry32(Math.floor(performance.now())));
    if (g.nextAt < 0) g.nextAt = t + nextGlitchDelay(rand);
    if (animating && t >= g.nextAt && u.uGlitch.value === 0) {
      const seed = Math.floor(rand() * 1e9);
      const bands = glitchBands(seed);
      bands.forEach((b, i) => u.uGlitchBands.value[i]?.set(b.y, b.x));
      u.uGlitchSeed.value = (seed % 1000) / 1000;
      u.uGlitch.value = 1;
      g.endAt = t + g.holdMs / 1000;
      g.holdMs = GLITCH_MS;
    }
    if (u.uGlitch.value === 1 && t >= g.endAt) {
      u.uGlitch.value = 0;
      g.nextAt = t + nextGlitchDelay(rand);
    }

    u.uPointScale.value = pointScaleFor(zoom, figure.count);
    u.uDpr.value = dpr;

    if (process.env.NEXT_PUBLIC_E2E === "1") {
      c.frames += 1;
      window.__figure = {
        frames: c.frames,
        trailCount: windTrail.count,
        yaw: u.uYaw.value,
        orbit: u.uOrbit.value,
        software,
        // A test can hold the slice longer than a real one, to look at it.
        glitch: (ms = GLITCH_MS) => {
          g.holdMs = ms;
          g.nextAt = stormNow();
          u.uGlitch.value = 0;
        },
      };
    }
  });

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={zoom} near={0.1} far={20} />
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={figureVert}
          fragmentShader={figureFrag}
          uniforms={uniforms}
          transparent={false}
          depthTest
          depthWrite
          blending={NormalBlending}
        />
      </points>
    </>
  );
}
