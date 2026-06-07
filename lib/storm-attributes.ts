// Per-point attributes for the pixel storm. Pure and seeded, so the canvas
// and the poster script (scripts/make-pixel-poster.mjs) build the same cloud.
import { mulberry32 } from "./pixel-sampler";

export const STORM_COLORS = ["#FF6B35", "#FFD23F", "#3BCEAC", "#5C7CFA", "#F06595", "#A78BFA"];

export interface StormAttributes {
  aTarget: Float32Array;
  aTarget2: Float32Array;
  aSeed: Float32Array;
  aColor: Float32Array;
}

const DEPTH_JITTER = 0.05;
const XY_JITTER = 0.003;
const LUMA_JITTER = 0.08;
// Band edges are dithered: a point near a border may take the next colour.
const BAND_DITHER = 0.35;
// A share of the pixels drift off the letters as dust, so the word dissolves
// into single squares at its edges instead of reading as a flat raster.
const HALO_SHARE = 0.07;
const HALO_MEAN = 0.016;
const DUST_SHARE = 0.012;
const DUST_X = 1.04;
const DUST_SIGMA_Y = 0.28; // dust thins out above and below the word, no hard edge
const DUST_MAX_Y = 0.95;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Colour band by column: x from -1..1 walks through the accents in order.
export function bandIndex(x: number, bands: number, dither = 0): number {
  const t = ((x + 1) / 2) * bands + dither;
  return Math.min(bands - 1, Math.max(0, Math.floor(t)));
}

export function buildStormAttributes(
  targets: Float32Array,
  count: number,
  colors: string[],
  seed = 7,
): StormAttributes {
  const rand = mulberry32(seed);
  const palette = colors.map(hexToRgb);
  const aTarget = new Float32Array(count * 3);
  const aSeed = new Float32Array(count);
  const aColor = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const s = rand();
    let x = (targets[i * 2] ?? 0) + (rand() - 0.5) * 2 * XY_JITTER;
    let y = (targets[i * 2 + 1] ?? 0) + (rand() - 0.5) * 2 * XY_JITTER;
    let dim = 1;
    const role = rand();
    if (role < DUST_SHARE) {
      x = (rand() * 2 - 1) * DUST_X;
      // Box-Muller: a normal spread around the word's line.
      const g = Math.sqrt(-2 * Math.log(1 - rand() * 0.999)) * Math.cos(rand() * Math.PI * 2);
      y = Math.max(-DUST_MAX_Y, Math.min(DUST_MAX_Y, g * DUST_SIGMA_Y));
      dim = 0.55;
    } else if (role < DUST_SHARE + HALO_SHARE) {
      // Exponential falloff: most halo pixels hug the letter, a few stray far.
      const r = -Math.log(1 - rand() * 0.999) * HALO_MEAN;
      const a = rand() * Math.PI * 2;
      x += Math.cos(a) * r;
      y += Math.sin(a) * r;
      dim = 0.85;
    }
    aTarget[i * 3] = x;
    aTarget[i * 3 + 1] = y;
    aTarget[i * 3 + 2] = (rand() - 0.5) * 2 * DEPTH_JITTER;
    aSeed[i] = s;
    const band = bandIndex(x, palette.length, (rand() - 0.5) * 2 * BAND_DITHER);
    const [r, g, b] = palette[band] ?? [1, 1, 1];
    // Per-point brightness jitter so the bands read as dithered, not flat.
    const k = (1 + (rand() - 0.5) * 2 * LUMA_JITTER) * dim;
    aColor[i * 3] = Math.min(1, r * k);
    aColor[i * 3 + 1] = Math.min(1, g * k);
    aColor[i * 3 + 2] = Math.min(1, b * k);
  }
  return { aTarget, aTarget2: aTarget.slice(), aSeed, aColor };
}

// Point size in CSS pixels for a slot height, as the shader expects it.
export function pointSizeFor(slotHeight: number): number {
  return Math.min(6, Math.max(2, slotHeight / 180));
}
