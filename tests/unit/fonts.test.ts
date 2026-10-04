import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Syne: (opts: { variable: string }) => ({
    variable: opts.variable,
    className: `cls${opts.variable}`,
  }),
  JetBrains_Mono: (opts: { variable: string }) => ({
    variable: opts.variable,
    className: `cls${opts.variable}`,
  }),
}));

import { display, mono } from "@/lib/fonts";

describe("fonts", () => {
  it("exports display and mono with css variable names", () => {
    expect(display.variable).toBe("--font-display-src");
    expect(mono.variable).toBe("--font-mono-src");
  });

  it("gives every font a class name and a variable ending in -src", () => {
    for (const font of [display, mono]) {
      expect(font.variable.endsWith("-src")).toBe(true);
      expect(typeof font.className).toBe("string");
      expect(font.className.length).toBeGreaterThan(0);
    }
  });
});
