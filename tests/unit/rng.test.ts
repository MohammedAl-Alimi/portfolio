import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/rng";

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
