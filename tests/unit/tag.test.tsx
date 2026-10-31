import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Tag } from "@/components/ui/Tag";

it("tints the tag with the given colour", () => {
  render(<Tag color="#ff6b35">React</Tag>);
  const tag = screen.getByText("React");
  expect(tag.style.backgroundColor).not.toBe("");
  expect(tag.style.color).not.toBe("");
});

it("uses neutral styling without a colour", () => {
  render(<Tag>Plain</Tag>);
  expect(screen.getByText("Plain").getAttribute("style")).toBeNull();
});
