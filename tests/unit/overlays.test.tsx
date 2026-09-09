import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { Overlays } from "@/components/ui/Overlays";

it("renders three click-through, hidden layers", () => {
  const { container } = render(<Overlays />);
  const root = container.querySelector("[data-overlay]") as HTMLElement;
  expect(root).not.toBeNull();
  expect(root.getAttribute("aria-hidden")).toBe("true");
  expect(root.className).toContain("pointer-events-none");
  expect(root.className).toContain("z-[60]");
  expect(container.querySelector("[data-overlay-scanlines]")).not.toBeNull();
  expect(container.querySelector("[data-overlay-grain]")).not.toBeNull();
  expect(container.querySelector("[data-overlay-vignette]")).not.toBeNull();
  expect(container.querySelector("feTurbulence")).not.toBeNull();
});
