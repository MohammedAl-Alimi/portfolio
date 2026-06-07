import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { Grain } from "@/components/ui/Grain";

it("renders a hidden, click-through overlay", () => {
  const { container } = render(<Grain />);
  const grain = container.querySelector("[data-grain]") as HTMLElement;
  expect(grain).not.toBeNull();
  expect(grain.getAttribute("aria-hidden")).toBe("true");
  expect(grain.className).toContain("pointer-events-none");
  expect(container.querySelector("feTurbulence")).not.toBeNull();
});
