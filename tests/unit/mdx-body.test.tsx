import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MdxBody } from "@/components/mdx/MdxBody";

describe("MdxBody", () => {
  it("does not let raw html anchors reach the DOM", async () => {
    const ui = await MdxBody({
      source: 'Hello <a href="http://evil.example">x</a> [ok](https://example.com)',
    });
    const { container } = render(ui);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("http://evil.example");
    expect(hrefs.filter((h) => h === "https://example.com")).toHaveLength(1);
  });
});

describe("MdxBody code blocks", () => {
  it("leave sideways swipes to the browser, not Lenis", async () => {
    const ui = await MdxBody({ source: "```\nconst x = 1;\n```" });
    const { container } = render(ui);
    expect(container.querySelector("pre")?.hasAttribute("data-lenis-prevent-horizontal")).toBe(true);
  });
});
