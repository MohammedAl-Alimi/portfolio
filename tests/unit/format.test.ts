import { expect, it } from "vitest";
import { pad2 } from "@/lib/format";

it("pads to two digits", () => {
  expect(pad2(1)).toBe("01");
  expect(pad2(12)).toBe("12");
});
