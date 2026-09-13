import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "@/lib/nav";

describe("NAV_ITEMS", () => {
  it("lists the five rail items in order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["HOME", "WORK", "LAB", "ABOUT", "CONTACT"]);
  });
  it("points every item at a real route", () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual(["/", "/projects", "/lab", "/about", "/contact"]);
  });
  it("gives every item an icon key", () => {
    expect(NAV_ITEMS.map((i) => i.icon)).toEqual(["home", "work", "lab", "about", "contact"]);
  });
});
