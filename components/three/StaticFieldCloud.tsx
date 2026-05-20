"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry, type ShaderMaterial } from "three";
import type { Figure } from "@/lib/figure";
import { figureZoom, pointScaleFor } from "@/lib/figure-fx";
import { mulberry32 } from "@/lib/rng";
import { useSceneStore } from "@/lib/scene-store";
import type { SlotSize } from "@/lib/use-slot";
import { useMarkReady } from "./ready";

const SCATTER_SEED = 404;
const DEPTH = 0.5;

// position: the figure. aScatter: a random spot in the slot. uMix 0 is static, 1 the whole figure.
// Point size follows lib/figure-fx pointSizePx: 1.5 to 3.5 CSS px from luminance.
const vert = /* glsl */ `
uniform float uMix;
uniform float uPointScale;
uniform float uDpr;
attribute vec3 aScatter;
attribute float aLum;
varying float vLum;
void main() {
  vLum = aLum;
  vec3 p = mix(aScatter, position, uMix);
  gl_PointSize = clamp(mix(1.5, 3.5, aLum) * uPointScale, 1.5, 3.5) * uDpr;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const frag = /* glsl */ `
varying float vLum;
void main() {
  gl_FragColor = vec4(vec3(0.15 + 0.75 * vLum), 1.0);
}
`;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The figure's points, plus a seeded uniform scatter over the visible box (half extents in world units). */
function buildGeometry(figure: Figure, halfW: number, halfH: number): BufferGeometry {
  const n = figure.count;
  const rand = mulberry32(SCATTER_SEED);
  const scatter = new Float32Array(n * 3);
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    scatter[i * 3] = (rand() * 2 - 1) * halfW;
    scatter[i * 3 + 1] = (rand() * 2 - 1) * halfH;
    scatter[i * 3 + 2] = (rand() * 2 - 1) * DEPTH;
    lum[i] = (figure.luminance[i] ?? 0) / 255;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(figure.positions.slice(0, n * 3), 3));
  g.setAttribute("aScatter", new BufferAttribute(scatter, 3));
  g.setAttribute("aLum", new BufferAttribute(lum, 1));
  return g;
}

interface Props {
  figure: Figure;
  size: SlotSize;
  /** True eases the points into the figure, false back into static. */
  whole: boolean;
  /** Length of the ease, in ms. */
  durationMs: number;
}

/** The 404 figure: static that reassembles. No rotation, wind or pointer, so it stays small. */
export function StaticFieldCloud({ figure, size, whole, durationMs }: Props) {
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  useMarkReady();

  const zoom = figureZoom(size.width, size.height);
  const halfW = size.width / zoom / 2;
  const halfH = size.height / zoom / 2;
  const geometry = useMemo(() => buildGeometry(figure, halfW, halfH), [figure, halfW, halfH]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const [uniforms] = useState(() => ({ uMix: { value: 0 }, uPointScale: { value: 1 }, uDpr: { value: 1 } }));
  const materialRef = useRef<ShaderMaterial>(null);
  const tween = useRef({ from: 0, to: 0, start: -1 });

  useEffect(() => {
    const mat = materialRef.current;
    const t = tween.current;
    t.from = mat ? (mat.uniforms.uMix?.value as number) : t.to;
    t.to = whole ? 1 : 0;
    t.start = -1;
    invalidate();
  }, [whole, invalidate]);

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms as typeof uniforms;
    const t = tween.current;
    const now = performance.now();
    if (t.start < 0) t.start = now;
    const p = reducedMotion ? 1 : Math.min(1, (now - t.start) / durationMs);
    u.uMix.value = t.from + (t.to - t.from) * easeOutCubic(p);
    u.uPointScale.value = pointScaleFor(zoom, figure.count);
    u.uDpr.value = dpr;
    // Demand loop: keep drawing only while the tween runs.
    if (p < 1) invalidate();
  });

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={zoom} near={0.1} far={20} />
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial ref={materialRef} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthTest depthWrite />
      </points>
    </>
  );
}
