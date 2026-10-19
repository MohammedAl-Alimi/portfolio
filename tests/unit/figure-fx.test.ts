import { describe, expect, it } from "vitest";
import {
  buildFigureAttributes,
  figureZoom,
  GLITCH_BAND,
  glitchBands,
  kindFromZ,
  nextGlitchDelay,
  pointScaleFor,
  scanY,
  wrapAngle,
} from "@/lib/figure-fx";
import type { Figure } from "@/lib/figure";
import { mulberry32 } from "@/lib/rng";

describe("kindFromZ", () => {
  it("splits front, back and interior at plus or minus 0.01", () => {
    expect(kindFromZ(0.5)).toBe(0);
    expect(kindFromZ(0.011)).toBe(0);
    expect(kindFromZ(-0.5)).toBe(1);
    expect(kindFromZ(-0.011)).toBe(1);
    expect(kindFromZ(0)).toBe(2);
    expect(kindFromZ(0.01)).toBe(2);
    expect(kindFromZ(-0.01)).toBe(2);
  });
});

describe("buildFigureAttributes", () => {
  const tiny: Figure = {
    count: 3,
    positions: new Float32Array([0, 0.5, 0.4, 0.1, -0.2, -0.3, -0.4, 0.9, 0]),
    luminance: new Uint8Array([255, 0, 51]),
  };

  it("gives one value per point for each attribute", () => {
    const a = buildFigureAttributes(tiny);
    expect(a.aPos).toHaveLength(9);
    expect(a.aLum).toHaveLength(3);
    expect(a.aSeed).toHaveLength(3);
    expect(a.aKind).toHaveLength(3);
  });

  it("copies positions, scales luminance and derives the kind", () => {
    const a = buildFigureAttributes(tiny);
    expect(Array.from(a.aPos)).toEqual(Array.from(tiny.positions));
    expect(a.aLum[0]).toBe(1);
    expect(a.aLum[1]).toBe(0);
    expect(a.aLum[2]).toBeCloseTo(0.2);
    expect(Array.from(a.aKind)).toEqual([0, 1, 2]);
  });

  it("gives seeds in 0..1, the same each build", () => {
    const a = buildFigureAttributes(tiny);
    const b = buildFigureAttributes(tiny);
    expect(Array.from(a.aSeed)).toEqual(Array.from(b.aSeed));
    for (const s of a.aSeed) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(1);
    }
  });
});

describe("glitchBands", () => {
  it("picks three separate bands with offsets of 0.03 to 0.09 either way", () => {
    for (let seed = 0; seed < 200; seed++) {
      const bands = glitchBands(seed);
      expect(bands).toHaveLength(3);
      for (const b of bands) {
        expect(Math.abs(b.x)).toBeGreaterThanOrEqual(0.03);
        expect(Math.abs(b.x)).toBeLessThanOrEqual(0.09);
        expect(Math.abs(b.y)).toBeLessThanOrEqual(1);
      }
      const ys = bands.map((b) => b.y).sort((p, q) => p - q);
      for (let i = 1; i < ys.length; i++) expect(ys[i]! - ys[i - 1]!).toBeGreaterThanOrEqual(GLITCH_BAND);
    }
  });

  it("is deterministic and changes with the seed", () => {
    expect(glitchBands(5)).toEqual(glitchBands(5));
    expect(glitchBands(5)).not.toEqual(glitchBands(6));
  });

  it("shifts both ways across seeds", () => {
    const signs = new Set<number>();
    for (let seed = 0; seed < 20; seed++) for (const b of glitchBands(seed)) signs.add(Math.sign(b.x));
    expect(signs).toEqual(new Set([-1, 1]));
  });
});

describe("timing helpers", () => {
  it("waits 6 to 10 s between glitches", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const d = nextGlitchDelay(rng);
      expect(d).toBeGreaterThanOrEqual(6);
      expect(d).toBeLessThanOrEqual(10);
    }
  });

  it("sweeps the scanline from -1.2 to 1.2 every 4 s", () => {
    expect(scanY(0)).toBeCloseTo(-1.2);
    expect(scanY(2)).toBeCloseTo(0);
    expect(scanY(3.999)).toBeCloseTo(1.2, 2);
    expect(scanY(4)).toBeCloseTo(-1.2);
  });

  it("wraps the yaw into 0..2 pi", () => {
    expect(wrapAngle(0.5)).toBeCloseTo(0.5);
    expect(wrapAngle(Math.PI * 2 + 0.5)).toBeCloseTo(0.5);
    expect(wrapAngle(-0.5)).toBeCloseTo(Math.PI * 2 - 0.5);
  });
});

describe("framing", () => {
  it("scales points with the camera zoom and the point density, clamped to 0.8..3", () => {
    expect(pointScaleFor(190)).toBe(1);
    expect(pointScaleFor(380)).toBe(2);
    expect(pointScaleFor(190, 56000 / 4)).toBe(2);
    expect(pointScaleFor(50)).toBe(0.8);
    expect(pointScaleFor(1000)).toBe(3);
  });

  it("matches the poster's framing under object-cover", () => {
    // The poster draws 0.47 * 1200 px per unit at 1600 by 1200.
    expect(figureZoom(1600, 1200)).toBeCloseTo(564);
    expect(figureZoom(800, 600)).toBeCloseTo(282);
    // A tall slot is filled by its height, a wide one by its width.
    expect(figureZoom(800, 1200)).toBeCloseTo(564);
    expect(figureZoom(3200, 600)).toBeCloseTo(1128);
  });
});
