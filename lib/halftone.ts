// Pure helpers behind the halftone covers (components/media/Halftone.tsx).
// An ordered dither: each pixel is compared with a fixed threshold from a 4 by 4
// Bayer matrix, so a flat grey becomes an even pattern of dark and light cells.

/** The classic 4 by 4 Bayer matrix, values 0..15. */
export const BAYER4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Threshold for cell (x, y), in 0..1. The pattern repeats every 4 cells. */
export function bayerThreshold(x: number, y: number): number {
  const row = BAYER4[y & 3] ?? [];
  return ((row[x & 3] ?? 0) + 0.5) / 16;
}

/** Rec. 709 luminance of an 8-bit RGB pixel, in 0..1. */
export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** 1 when the cell at (x, y) is light, 0 when it is dark. */
export function ditherPixel(lum: number, x: number, y: number): 0 | 1 {
  return lum > bayerThreshold(x, y) ? 1 : 0;
}
