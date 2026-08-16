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

function stubFactory(pattern = PATTERN, measure = 0) {
  const calls: string[] = [];
  const lines: { text: string; y: number }[] = [];
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
      fillText: (text: string, _x: number, y: number) => {
        calls.push(text);
        lines.push({ text, y });
      },
      measureText: (text: string) => ({ width: text.length * measure }) as TextMetrics,
      getImageData: () => ({ data, width: w, height: h, colorSpace: "srgb" }) as ImageData,
    };
  };
  return { getContext, calls, lines };
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

describe("sampleText with several lines", () => {
  // Two bands of pixels, as two drawn lines would leave.
  const TALL = [
    "........",
    ".##..##.",
    "........",
    "........",
    "........",
    "........",
    ".##..##.",
    "........",
  ];

  it("draws each line centred, 0.92 x font size apart", () => {
    const { getContext, lines } = stubFactory();
    sampleText(["AB", "CD"], { ...base, step: 1, getContext });
    expect(lines.map((l) => l.text)).toEqual(["AB", "CD"]);
    expect(lines[0]!.y).toBeCloseTo(-4.6);
    expect(lines[1]!.y).toBeCloseTo(4.6);
  });

  it("returns points in two vertical bands", () => {
    const { getContext } = stubFactory(TALL);
    const pts = sampleText(["AB", "CD"], { ...base, height: 8, step: 1, getContext });
    const ys = new Set<number>();
    for (let i = 1; i < pts.length; i += 2) ys.add(pts[i]!);
    expect([...ys]).toEqual([0.625, -0.625]);
    expect(pts.length / 2).toBe(8);
  });

  it("sizes the font so the widest line spans the width minus 6%", () => {
    const transforms: number[] = [];
    const { getContext } = stubFactory(PATTERN, 2);
    const wrapped = (w: number, h: number): SamplerContext => {
      const ctx = getContext(w, h);
      return {
        ...ctx,
        setTransform: (a: number) => {
          transforms.push(a);
        },
      } as SamplerContext;
    };
    // Widest line "ABCD" measures 8 px at 10 px. 8 px wide canvas, 94% -> scale 0.94.
    // The canvas is tall enough that the height does not limit the scale.
    sampleText(["AB", "ABCD"], { ...base, height: 40, step: 1, getContext: wrapped });
    expect(transforms[0]).toBeCloseTo(0.94);
  });

  it("shrinks to fit the height when the block is too tall", () => {
    const transforms: number[] = [];
    const { getContext } = stubFactory(PATTERN, 2);
    const wrapped = (w: number, h: number): SamplerContext => ({
      ...getContext(w, h),
      setTransform: (a: number) => {
        transforms.push(a);
      },
    }) as SamplerContext;
    // Two lines at 10 px take 18.4 px; 4 px tall canvas, 94% -> 3.76 / 18.4.
    sampleText(["AB", "ABCD"], { ...base, step: 1, getContext: wrapped });
    expect(transforms[0]).toBeCloseTo(3.76 / 18.4);
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
