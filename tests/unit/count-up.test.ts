import { describe, expect, it } from "vitest";
import { countAt, countDuration, formatCount } from "@/lib/count-up";

describe("countAt", () => {
  it("runs from 0 to the target and lands exactly on it", () => {
    expect(countAt(2025, 0)).toBe(0);
    expect(countAt(2025, 1)).toBe(2025);
    expect(countAt(2025, 1.5)).toBe(2025);
    expect(countAt(2025, -1)).toBe(0);
  });

  it("eases out: past half way at the midpoint, and only whole numbers", () => {
    const mid = countAt(2025, 0.5);
    expect(mid).toBeGreaterThan(2025 / 2);
    expect(Number.isInteger(mid)).toBe(true);
  });

  it("never goes backwards", () => {
    let last = -1;
    for (let i = 0; i <= 20; i++) {
      const v = countAt(12, i / 20);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
});

describe("formatCount", () => {
  it("pads to the target's width with no thousands separator", () => {
    expect(formatCount(7, 2025)).toBe("0007");
    expect(formatCount(2025, 2025)).toBe("2025");
    expect(formatCount(3, 12)).toBe("03");
    expect(formatCount(12345, 12345)).toBe("12345");
  });
});

describe("countDuration", () => {
  it("is 900 ms, shorter for small counts", () => {
    expect(countDuration(2025)).toBe(900);
    expect(countDuration(3)).toBeLessThan(900);
    expect(countDuration(0)).toBe(0);
  });
});
