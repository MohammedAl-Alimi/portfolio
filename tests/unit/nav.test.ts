import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "@/lib/nav";

describe("NAV_ITEMS", () => {
  it("lists the five items in order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Projects",
      "Lab",
      "About",
      "Contact",
    ]);
  });
  it("points Contact at the footer anchor", () => {
    expect(NAV_ITEMS.find((i) => i.label === "Contact")?.href).toBe("/#contact");
  });
});
