import { describe, expect, it } from "vitest";
import { decodeDuration, decodeFrame, GLYPHS } from "@/lib/decode";
import { mulberry32 } from "@/lib/rng";

const TEXT = "MOHAMMED AL-ALIMI";

describe("decodeFrame", () => {
  it("shows only glyphs at progress 0 and keeps spaces", () => {
    const out = decodeFrame(TEXT, 0, mulberry32(1));
    expect(out).toHaveLength(TEXT.length);
    for (let i = 0; i < TEXT.length; i++) {
      if (TEXT[i] === " ") expect(out[i]).toBe(" ");
      else expect(GLYPHS).toContain(out[i]);
    }
  });

  it("shows the text at progress 1 and beyond", () => {
    expect(decodeFrame(TEXT, 1, mulberry32(1))).toBe(TEXT);
    expect(decodeFrame(TEXT, 2, mulberry32(1))).toBe(TEXT);
  });

  it("resolves left to right and never un-resolves", () => {
    let resolved = 0;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const out = decodeFrame(TEXT, p, mulberry32(3));
      let prefix = 0;
      while (prefix < TEXT.length && out[prefix] === TEXT[prefix]) prefix++;
      // Everything before the resolved count matches; the count only grows.
      const count = Math.floor(Math.min(1, p) * TEXT.length);
      expect(prefix).toBeGreaterThanOrEqual(count);
      expect(count).toBeGreaterThanOrEqual(resolved);
      resolved = count;
    }
  });

  it("is deterministic for a seed", () => {
    expect(decodeFrame(TEXT, 0.3, mulberry32(9))).toBe(decodeFrame(TEXT, 0.3, mulberry32(9)));
  });

  it("handles empty text", () => {
    expect(decodeFrame("", 0.5, mulberry32(1))).toBe("");
  });
});

describe("decodeDuration", () => {
  it("is 24 ms per character, capped at 900 ms", () => {
    expect(decodeDuration(17, 24, 900)).toBe(408);
    expect(decodeDuration(100, 24, 900)).toBe(900);
  });
});
