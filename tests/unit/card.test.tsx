import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Card } from "@/components/ui/Card";

it("renders a link when href is set", () => {
  render(<Card href="/projects/a">Project A</Card>);
  expect(screen.getByRole("link", { name: "Project A" })).toHaveAttribute(
    "href",
    "/projects/a",
  );
});

it("renders no link without href", () => {
  render(<Card>Plain</Card>);
  expect(screen.queryByRole("link")).toBeNull();
});

it("draws a 1px monochrome border and ignores the colour prop", () => {
  const { container } = render(<Card color="#ff6b35">Body</Card>);
  const card = container.querySelector(".bg-surface") as HTMLElement;
  expect(card.className).toContain("border-border");
  expect(card.className).not.toContain("border-2");
  expect(card.style.borderColor).toBe("");
});

it("draws four corner brackets", () => {
  const { container } = render(<Card>Body</Card>);
  expect(container.querySelectorAll("[data-bracket]")).toHaveLength(4);
});
