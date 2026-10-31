import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Unbounded: (opts: { variable: string }) => ({
    variable: opts.variable,
    className: `cls${opts.variable}`,
  }),
  Manrope: (opts: { variable: string }) => ({
    variable: opts.variable,
    className: `cls${opts.variable}`,
  }),
  Silkscreen: (opts: { variable: string }) => ({
    variable: opts.variable,
    className: `cls${opts.variable}`,
  }),
}));

import { display, pixel, sans } from "@/lib/fonts";

describe("fonts", () => {
  it("exports display, sans and pixel with css variable names", () => {
    expect(display.variable).toBe("--font-display-src");
    expect(sans.variable).toBe("--font-sans-src");
    expect(pixel.variable).toBe("--font-pixel-src");
  });

  it("gives every font a class name and a variable ending in -src", () => {
    for (const font of [display, sans, pixel]) {
      expect(font.variable.endsWith("-src")).toBe(true);
      expect(typeof font.className).toBe("string");
      expect(font.className.length).toBeGreaterThan(0);
    }
  });
});
