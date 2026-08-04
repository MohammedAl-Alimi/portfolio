import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Tag } from "@/components/ui/Tag";

it("shows a colour dot when a colour is given", () => {
  const { container } = render(<Tag color="#ff6b35">React</Tag>);
  const dot = container.querySelector("[data-tag-dot]") as HTMLElement;
  expect(dot).not.toBeNull();
  expect(dot.style.backgroundColor).not.toBe("");
});

it("uses the mono font and a hard border", () => {
  render(<Tag>Plain</Tag>);
  const tag = screen.getByText("Plain");
  expect(tag.className).toContain("font-mono");
  expect(tag.className).toContain("border-border");
  expect(tag.getAttribute("style")).toBeNull();
});
