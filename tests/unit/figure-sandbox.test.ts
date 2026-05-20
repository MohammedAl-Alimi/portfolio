import { describe, expect, it } from "vitest";
import { FULL_COUNT } from "@/lib/figure-fx";
import { countCap, MID_COUNT, MIN_COUNT, resolveCount, SANDBOX_DEFAULTS, SANDBOX_STILL } from "@/lib/figure-sandbox";

describe("countCap", () => {
  it("allows the full figure only on the high tier", () => {
    expect(countCap("high")).toBe(FULL_COUNT);
    expect(countCap("mid")).toBe(MID_COUNT);
    expect(countCap("low")).toBe(MID_COUNT);
    expect(countCap(null)).toBe(MID_COUNT);
  });
});

describe("resolveCount", () => {
  it("uses the cap until the visitor picks a count", () => {
    expect(resolveCount(null, FULL_COUNT)).toBe(FULL_COUNT);
    expect(resolveCount(null, MID_COUNT)).toBe(MID_COUNT);
  });

  it("keeps a pick inside the slider's range", () => {
    expect(resolveCount(20000, FULL_COUNT)).toBe(20000);
    expect(resolveCount(56000, MID_COUNT)).toBe(MID_COUNT);
    expect(resolveCount(500, MID_COUNT)).toBe(MIN_COUNT);
    expect(resolveCount(12345.6, MID_COUNT)).toBe(12346);
  });
});

describe("sandbox defaults", () => {
  it("match the hero figure", () => {
    expect(SANDBOX_DEFAULTS).toEqual({ yawSpeed: 0.15, glitchRate: 1, scanline: true, windGain: 0.03 });
  });

  it("hold still under reduced motion", () => {
    expect(SANDBOX_STILL.yawSpeed).toBe(0);
    expect(SANDBOX_STILL.glitchRate).toBe(0);
  });
});
