import { describe, expect, it } from "vitest";
import {
  centerAndFit,
  fitToCount,
  mulberry32,
  sampleText,
  type SamplerContext,
} from "@/lib/pixel-sampler";

// 8x4 bitmap. "#" is alpha 255, "+" is alpha 128 (below the cut-off), "." is empty.
const PATTERN = [
  ".#......",
  "..#..#..",
  "...+....",
  "#......#",
];

function stubFactory(pattern = PATTERN) {
  const calls: string[] = [];
  const getContext = (w: number, h: number): SamplerContext => {
    const data = new Uint8ClampedArray(w * h * 4);
    pattern.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const a = ch === "#" ? 255 : ch === "+" ? 128 : 0;
        data[(y * w + x) * 4 + 3] = a;
      });
    });
    return {
      font: "",
      fillStyle: "",
      textAlign: "start",
      textBaseline: "alphabetic",
      clearRect: () => {},
      setTransform: () => {},
      fillText: (text: string) => {
        calls.push(text);
      },
      measureText: () => ({ width: 0 }) as TextMetrics,
      getImageData: () => ({ data, width: w, height: h, colorSpace: "srgb" }) as ImageData,
    };
  };
  return { getContext, calls };
}

const base = { font: "700 10px Test", width: 8, height: 4 };

describe("sampleText", () => {
  it("emits normalised points for opaque pixels in row-major order", () => {
    const { getContext, calls } = stubFactory();
    const pts = sampleText("HI", { ...base, step: 1, getContext });
    expect(calls).toEqual(["HI"]);
    expect(Array.from(pts)).toEqual([
      -0.625, 0.375,
      -0.375, 0.125,
      0.375, 0.125,
      -0.875, -0.375,
      0.875, -0.375,
    ]);
  });

  it("respects the step", () => {
    const { getContext } = stubFactory();
    const pts = sampleText("HI", { ...base, step: 2, getContext });
    // Rows 1 and 3, columns 1, 3, 5 and 7 are visited.
    expect(Array.from(pts)).toEqual([0.375, 0.125, 0.875, -0.375]);
  });

  it("is deterministic and returns xy pairs", () => {
    const a = sampleText("HI", { ...base, step: 1, getContext: stubFactory().getContext });
    const b = sampleText("HI", { ...base, step: 1, getContext: stubFactory().getContext });
    expect(a.length % 2).toBe(0);
    expect(Array.from(a)).toEqual(Array.from(b));
  });
});

describe("fitToCount", () => {
  const src = new Float32Array([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);

  it("decimates evenly down to the exact count", () => {
    const out = fitToCount(src, 2);
    expect(out.length).toBe(4);
    expect(Array.from(out)).toEqual([0, 0, 2, 2]);
  });

  it("pads with copies of existing points up to the exact count", () => {
    const out = fitToCount(src, 12, 3);
    expect(out.length).toBe(24);
    expect(Array.from(out.slice(0, 10))).toEqual(Array.from(src));
    for (let i = 5; i < 12; i++) {
      const x = out[i * 2];
      expect(out[i * 2 + 1]).toBe(x);
      expect([0, 1, 2, 3, 4]).toContain(x);
    }
    expect(Array.from(fitToCount(src, 12, 3))).toEqual(Array.from(out));
  });

  it("returns zeros when there is nothing to copy", () => {
    expect(Array.from(fitToCount(new Float32Array(0), 3))).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe("centerAndFit", () => {
  it("centres the points and scales x to span -1..1", () => {
    const out = centerAndFit(new Float32Array([0, 0, 2, 1, 4, 0]));
    expect(Array.from(out)).toEqual([-1, -0.25, 0, 0.25, 1, -0.25]);
  });
});

describe("mulberry32", () => {
  it("is seeded and stays in 0..1", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
