import { describe, expect, it } from "vitest";
import { ORBIT_MAX, orbitFor } from "@/lib/figure-fx";

describe("orbitFor", () => {
  it("is 0 at the top and ORBIT_MAX once the hero has scrolled out", () => {
    expect(ORBIT_MAX).toBe(0.52);
    expect(orbitFor(0, 800)).toBe(0);
    expect(orbitFor(800, 800)).toBeCloseTo(0.52);
    expect(orbitFor(2000, 800)).toBeCloseTo(0.52);
  });

  it("maps linearly in between", () => {
    expect(orbitFor(400, 800)).toBeCloseTo(0.26);
    expect(orbitFor(200, 800)).toBeCloseTo(0.13);
  });

  it("clamps overscroll and a missing hero", () => {
    expect(orbitFor(-50, 800)).toBe(0);
    expect(orbitFor(100, 0)).toBe(0);
    expect(orbitFor(Number.NaN, 800)).toBe(0);
  });
});
