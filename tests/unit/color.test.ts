import { describe, expect, it } from "vitest";
import { contrastText } from "@/lib/color";

describe("contrastText", () => {
  it("returns the colour with the higher contrast ratio", () => {
    // #FFD23F: dark 12.5:1, light 1.3:1
    expect(contrastText("#FFD23F")).toBe("#17161A");
    // #5C7CFA: dark 4.9:1, light 3.3:1 (light would fail AA for normal text)
    expect(contrastText("#5C7CFA")).toBe("#17161A");
    // #F06595: dark 6.0:1, light 2.7:1
    expect(contrastText("#F06595")).toBe("#17161A");
    // #121117: dark 1.0:1, light 17.0:1
    expect(contrastText("#121117")).toBe("#F6F3EE");
  });
  it("handles black, white and short hex", () => {
    expect(contrastText("#000000")).toBe("#F6F3EE");
    expect(contrastText("#fff")).toBe("#17161A");
  });
});
