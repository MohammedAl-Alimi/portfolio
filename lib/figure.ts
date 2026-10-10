// Reads the hero figure point cloud (public/figure/bust.bin).
// Pure data code: no three.js, so it can be tested and imported anywhere.
//
// Format MA01 (see scripts/figure/README.md):
//   bytes 0..3  magic "MA01"
//   bytes 4..7  uint32 little-endian point count
//   then count records of 4 bytes: x, y, z as int8 (value * 127), luminance as uint8
import { mulberry32 } from "./pixel-sampler";

export interface Figure {
  count: number;
  /** xyz per point, each in -1..1. */
  positions: Float32Array;
  /** 0..255 per point. */
  luminance: Uint8Array;
}

export class FigureFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FigureFormatError";
  }
}

const MAGIC = [0x4d, 0x41, 0x30, 0x31]; // "MA01"
const HEADER_BYTES = 8;
const RECORD_BYTES = 4;

export function parseFigure(buffer: ArrayBuffer): Figure {
  if (buffer.byteLength < HEADER_BYTES) {
    throw new FigureFormatError("figure: file is shorter than its header");
  }
  const bytes = new Uint8Array(buffer);
  if (MAGIC.some((b, i) => bytes[i] !== b)) {
    throw new FigureFormatError("figure: bad magic");
  }
  const count = new DataView(buffer).getUint32(4, true);
  if (count === 0) {
    throw new FigureFormatError("figure: count is zero");
  }
  if (buffer.byteLength !== HEADER_BYTES + count * RECORD_BYTES) {
    throw new FigureFormatError("figure: length does not match the count");
  }
  const signed = new Int8Array(buffer, HEADER_BYTES);
  const positions = new Float32Array(count * 3);
  const luminance = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * RECORD_BYTES;
    positions[i * 3] = (signed[o] ?? 0) / 127;
    positions[i * 3 + 1] = (signed[o + 1] ?? 0) / 127;
    positions[i * 3 + 2] = (signed[o + 2] ?? 0) / 127;
    luminance[i] = bytes[HEADER_BYTES + o + 3] ?? 0;
  }
  return { count, positions, luminance };
}

/** A seeded random subset of `count` points, in file order. */
export function subsample(fig: Figure, count: number, seed: number): Figure {
  if (count >= fig.count) return fig;
  const n = Math.max(0, Math.floor(count));
  const rand = mulberry32(seed);
  const order = new Uint32Array(fig.count);
  for (let i = 0; i < fig.count; i++) order[i] = i;
  // Partial Fisher-Yates: the first n slots end up a uniform random subset.
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (fig.count - i));
    const t = order[i] ?? i;
    order[i] = order[j] ?? j;
    order[j] = t;
  }
  const picked = order.subarray(0, n).sort();
  const positions = new Float32Array(n * 3);
  const luminance = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    const i = picked[k] ?? 0;
    positions[k * 3] = fig.positions[i * 3] ?? 0;
    positions[k * 3 + 1] = fig.positions[i * 3 + 1] ?? 0;
    positions[k * 3 + 2] = fig.positions[i * 3 + 2] ?? 0;
    luminance[k] = fig.luminance[i] ?? 0;
  }
  return { count: n, positions, luminance };
}

export interface LoadFigureOptions {
  count: number;
  signal?: AbortSignal;
  seed?: number;
}

/** Fetches and parses the figure. Any failure gives `null`; it never throws. */
export async function loadFigure(
  url: string,
  { count, signal, seed = 7 }: LoadFigureOptions,
): Promise<Figure | null> {
  try {
    const res = await fetch(url, { cache: "force-cache", signal });
    if (!res.ok) return null;
    const fig = parseFigure(await res.arrayBuffer());
    return subsample(fig, count, seed);
  } catch {
    return null;
  }
}
