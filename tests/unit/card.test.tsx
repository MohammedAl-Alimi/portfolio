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

it("draws a full 2px border in the given colour", () => {
  render(<Card color="#3bceac">Coloured</Card>);
  const card = screen.getByText("Coloured");
  expect(card.className).toContain("border-2");
  expect(card.style.borderColor).not.toBe("");
  expect(card.style.borderTopWidth).toBe("");
});
