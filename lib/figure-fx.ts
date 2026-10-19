// Pure helpers behind the hero figure: attributes, glitch, scanline and framing.
// No three.js here, so they are unit tested directly (tests/unit/figure-fx.test.ts).
import type { Figure } from "./figure";
import { mulberry32 } from "./rng";

/** 0 front shell, 1 back shell, 2 interior. Matches the shader's base brightness per kind. */
export type FigureKind = 0 | 1 | 2;

export function kindFromZ(z: number): FigureKind {
  if (z > 0.01) return 0;
  if (z < -0.01) return 1;
  return 2;
}

export interface FigureAttributes {
  aPos: Float32Array;
  /** 0..1 */
  aLum: Float32Array;
  /** 0..1, fixed per point */
  aSeed: Float32Array;
  aKind: Float32Array;
}

export function buildFigureAttributes(fig: Figure, seed = 11): FigureAttributes {
  const n = fig.count;
  const aPos = fig.positions.slice(0, n * 3);
  const aLum = new Float32Array(n);
  const aSeed = new Float32Array(n);
  const aKind = new Float32Array(n);
  const rand = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    aLum[i] = (fig.luminance[i] ?? 0) / 255;
    aSeed[i] = rand();
    aKind[i] = kindFromZ(aPos[i * 3 + 2] ?? 0);
  }
  return { aPos, aLum, aSeed, aKind };
}

/** Height of one glitch band in world units. */
export const GLITCH_BAND = 0.08;
export const GLITCH_MS = 120;
const BAND_SPAN = 0.9; // bands fall inside -0.9..0.9, where the figure is
const SHIFT_MIN = 0.03;
const SHIFT_MAX = 0.09; // about 24 px on the desktop slot

export interface GlitchBand {
  /** Centre of the band in world y. */
  y: number;
  /** Horizontal shift in world units, either sign. */
  x: number;
}

/** Three horizontal bands for one glitch. One per third of the figure, so they never overlap. */
export function glitchBands(seed: number): GlitchBand[] {
  const rand = mulberry32(seed);
  const third = (2 * BAND_SPAN) / 3;
  const bands: GlitchBand[] = [];
  for (let k = 0; k < 3; k++) {
    const lo = -BAND_SPAN + k * third + GLITCH_BAND / 2;
    const y = lo + rand() * (third - GLITCH_BAND);
    const mag = SHIFT_MIN + rand() * (SHIFT_MAX - SHIFT_MIN);
    bands.push({ y, x: rand() < 0.5 ? -mag : mag });
  }
  return bands;
}

/** Seconds until the next glitch: 6 to 10. */
export function nextGlitchDelay(rand: () => number): number {
  return 6 + 4 * rand();
}

const SCAN_PERIOD = 4;
const SCAN_FROM = -1.2;
const SCAN_TO = 1.2;

/** World y of the scanline at time t: one sweep up the figure every 4 s. */
export function scanY(t: number): number {
  const phase = (((t % SCAN_PERIOD) + SCAN_PERIOD) % SCAN_PERIOD) / SCAN_PERIOD;
  return SCAN_FROM + (SCAN_TO - SCAN_FROM) * phase;
}

const TAU = Math.PI * 2;

export function wrapAngle(a: number): number {
  return ((a % TAU) + TAU) % TAU;
}

/** Point count of the full figure; lower tiers draw a subset. */
export const FULL_COUNT = 56000;

/** Spec 18.4: points are 1.5 to 3.5 CSS px. The shader clamps the final size to this. */
export const POINT_MIN_PX = 1.5;
export const POINT_MAX_PX = 3.5;

/**
 * Point size multiplier, from 0.8 up to the factor that takes the smallest point
 * to the largest (3.5 / 1.5); beyond that the shader's clamp makes every point 3.5 px.
 * The points' spacing on screen grows with the camera zoom (px per world unit)
 * and with fewer points (spacing goes as 1 / sqrt(count)), so the size follows both.
 */
export function pointScaleFor(zoom: number, count = FULL_COUNT): number {
  const density = Math.sqrt(FULL_COUNT / Math.max(1, count));
  return Math.min(POINT_MAX_PX / POINT_MIN_PX, Math.max(0.8, (zoom / 190) * density));
}

/** CSS px size the shader draws, for a luminance in 0..1. Mirrors shaders/figure.ts. */
export function pointSizePx(lum: number, scale: number): number {
  const raw = (POINT_MIN_PX + (POINT_MAX_PX - POINT_MIN_PX) * lum) * scale;
  return Math.min(POINT_MAX_PX, Math.max(POINT_MIN_PX, raw));
}

// The poster (scripts/figure/build-points.py) draws 0.47 * height px per unit at 1600 by 1200.
const POSTER_W = 1600;
const POSTER_H = 1200;
const POSTER_UNIT = 0.47 * POSTER_H;

/** Camera zoom (px per world unit) so the cloud lands exactly on the object-cover poster. */
export function figureZoom(slotW: number, slotH: number): number {
  return POSTER_UNIT * Math.max(slotW / POSTER_W, slotH / POSTER_H);
}
