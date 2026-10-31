import { describe, expect, it } from "vitest";
import { contrastText } from "@/lib/color";

describe("contrastText", () => {
  it("picks dark text on yellow and light text on indigo", () => {
    expect(contrastText("#FFD23F")).toBe("#17161A");
    expect(contrastText("#5C7CFA")).toBe("#F6F3EE");
  });
  it("handles black, white and short hex", () => {
    expect(contrastText("#000000")).toBe("#F6F3EE");
    expect(contrastText("#fff")).toBe("#17161A");
  });
});
