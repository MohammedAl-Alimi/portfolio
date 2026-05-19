import { expect, it } from "vitest";
import { fillYear } from "@/lib/site-copy";

it("replaces the year placeholder", () => {
  expect(fillYear("MA · {year} · Built with Next.js", 2026)).toBe("MA · 2026 · Built with Next.js");
});

it("leaves a line without the placeholder alone", () => {
  expect(fillYear("Plain line", 2026)).toBe("Plain line");
});
