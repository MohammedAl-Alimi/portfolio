import { describe, expect, it } from "vitest";
import { BAYER4, bayerThreshold, ditherPixel, luminance } from "@/lib/halftone";

const cells = Array.from({ length: 16 }, (_, i) => ({ x: i % 4, y: Math.floor(i / 4) }));

describe("bayerThreshold", () => {
  it("gives 16 distinct thresholds inside 0..1", () => {
    const values = cells.map(({ x, y }) => bayerThreshold(x, y));
    expect(new Set(values).size).toBe(16);
    for (const v of values) {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("orders the thresholds by the matrix", () => {
    const sorted = cells.toSorted((a, b) => bayerThreshold(a.x, a.y) - bayerThreshold(b.x, b.y));
    expect(sorted.map(({ x, y }) => BAYER4[y]?.[x])).toEqual(Array.from({ length: 16 }, (_, i) => i));
  });

  it("repeats every 4 cells", () => {
    expect(bayerThreshold(5, 6)).toBe(bayerThreshold(1, 2));
    expect(bayerThreshold(12, 0)).toBe(bayerThreshold(0, 0));
  });
});

describe("ditherPixel", () => {
  it("is dark everywhere for black and light everywhere for white", () => {
    for (const { x, y } of cells) {
      expect(ditherPixel(0, x, y)).toBe(0);
      expect(ditherPixel(1, x, y)).toBe(1);
    }
  });

  it("lights exactly half of a 4 by 4 block for mid grey", () => {
    const lit = cells.reduce((n, { x, y }) => n + ditherPixel(0.5, x, y), 0);
    expect(lit).toBe(8);
  });
});

describe("luminance", () => {
  it("maps black to 0, white to 1 and weights green most", () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(1);
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(255, 0, 0));
    expect(luminance(255, 0, 0)).toBeGreaterThan(luminance(0, 0, 255));
  });
});
