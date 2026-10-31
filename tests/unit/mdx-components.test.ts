import { describe, expect, it } from "vitest";
import { isSafeHref, slugify } from "@/components/mdx/components";

describe("isSafeHref", () => {
  it.each(["https://example.com", "mailto:a@b.c", "/projects", "#problem"])("accepts %s", (h) => {
    expect(isSafeHref(h)).toBe(true);
  });
  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,x",
    "//evil.com",
    "/\\evil.com",
    " https://x",
    "http://example.com",
    "",
  ])("rejects %j", (h) => {
    expect(isSafeHref(h)).toBe(false);
  });
});

describe("slugify", () => {
  it("makes a readable id", () => {
    expect(slugify("What I built")).toBe("what-i-built");
  });
  it("falls back for headings with no ascii letters", () => {
    expect(slugify("مرحبا")).toBe("section");
  });
});
