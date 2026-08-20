// Turns a word into point targets for the pixel storm.
// This module has no imports on purpose: scripts/make-pixel-poster.mjs
// transpiles it and runs the same code in a headless browser.

export type SamplerContext = Pick<
  CanvasRenderingContext2D,
  | "font"
  | "fillStyle"
  | "textAlign"
  | "textBaseline"
  | "clearRect"
  | "setTransform"
  | "fillText"
  | "measureText"
  | "getImageData"
>;

export type ContextFactory = (width: number, height: number) => SamplerContext;

export interface SampleOptions {
  /** CSS font with a px size, for example `700 220px Unbounded`. */
  font: string;
  width: number;
  height: number;
  step: number;
  getContext: ContextFactory;
}

const ALPHA_CUTOFF = 128;
const TEXT_SPAN = 0.94; // the widest line spans the bitmap minus 6%
const LINE_HEIGHT = 0.92; // times the font size

// Small seeded PRNG, so every run builds the same cloud.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fontPx(font: string): number {
  const m = /(\d+(?:\.\d+)?)px/.exec(font);
  return m ? Number(m[1]) : 0;
}

function drawText(text: string | string[], opts: Omit<SampleOptions, "step">): ImageData {
  const { font, width, height, getContext } = opts;
  const lines = Array.isArray(text) ? text : [text];
  const ctx = getContext(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.font = font;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Scale uniformly so the widest line spans the bitmap, never squash a line.
  // The block must also fit the height.
  const lineStep = fontPx(font) * LINE_HEIGHT;
  const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
  let scale = widest > 0 ? (width * TEXT_SPAN) / widest : 1;
  const blockHeight = lineStep * lines.length;
  if (blockHeight * scale > height * TEXT_SPAN && blockHeight > 0) {
    scale = (height * TEXT_SPAN) / blockHeight;
  }
  ctx.setTransform(scale, 0, 0, scale, width / 2, height / 2);
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineStep);
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ctx.getImageData(0, 0, width, height);
}

function walk(img: ImageData, step: number): Float32Array {
  const { data, width, height } = img;
  const half = width / 2;
  const out: number[] = [];
  for (let fy = step / 2; fy < height; fy += step) {
    const py = Math.floor(fy);
    for (let fx = step / 2; fx < width; fx += step) {
      const px = Math.floor(fx);
      if ((data[(py * width + px) * 4 + 3] ?? 0) > ALPHA_CUTOFF) {
        // Divide both axes by half the width so letters keep their shape. y points up.
        out.push((px + 0.5 - half) / half, (height / 2 - (py + 0.5)) / half);
      }
    }
  }
  return new Float32Array(out);
}

// Draws `text` (one line, or several stacked) centred and returns xy pairs for every opaque sample, row by row.
// x spans -1..1 across the bitmap width, y uses the same scale.
export function sampleText(text: string | string[], opts: SampleOptions): Float32Array {
  return walk(drawText(text, opts), opts.step);
}

// Two passes: count filled pixels on a coarse grid, then pick the step that
// lands close to `count` points.
export function sampleTextToCount(
  text: string | string[],
  opts: Omit<SampleOptions, "step"> & { count: number },
): Float32Array {
  const img = drawText(text, opts);
  const coarse = 4;
  const filled = (walk(img, coarse).length / 2) * coarse * coarse;
  const step = Math.max(1, Math.sqrt(filled / Math.max(1, opts.count)));
  return walk(img, step);
}

// Exactly `count` points: even decimation when there are too many, seeded
// copies of existing points when there are too few.
export function fitToCount(points: Float32Array, count: number, seed = 1): Float32Array {
  const n = points.length / 2;
  const out = new Float32Array(count * 2);
  if (n === 0) return out;
  if (n >= count) {
    for (let i = 0; i < count; i++) {
      const j = Math.floor((i * n) / count);
      out[i * 2] = points[j * 2] ?? 0;
      out[i * 2 + 1] = points[j * 2 + 1] ?? 0;
    }
    return out;
  }
  out.set(points);
  const rand = mulberry32(seed);
  for (let i = n; i < count; i++) {
    const j = Math.floor(rand() * n);
    out[i * 2] = points[j * 2] ?? 0;
    out[i * 2 + 1] = points[j * 2 + 1] ?? 0;
  }
  return out;
}

// Centres the cloud on 0,0 and scales it so x spans exactly -1..1.
export function centerAndFit(points: Float32Array): Float32Array {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i] ?? 0;
    const y = points[i + 1] ?? 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const out = new Float32Array(points.length);
  if (points.length === 0) return out;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = (maxX - minX) / 2 || 1;
  for (let i = 0; i < points.length; i += 2) {
    out[i] = ((points[i] ?? 0) - cx) / half;
    out[i + 1] = ((points[i + 1] ?? 0) - cy) / half;
  }
  return out;
}
