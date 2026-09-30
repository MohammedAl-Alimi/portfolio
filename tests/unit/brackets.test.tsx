import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Brackets } from "@/components/ui/Brackets";

it("renders its children inside four hidden corner marks", () => {
  const { container } = render(
    <Brackets className="custom">
      <p>Inside</p>
    </Brackets>,
  );
  expect(screen.getByText("Inside")).not.toBeNull();
  const marks = container.querySelectorAll("[data-bracket]");
  expect(marks).toHaveLength(4);
  for (const mark of marks) expect(mark.getAttribute("aria-hidden")).toBe("true");
  expect((container.firstChild as HTMLElement).className).toContain("custom");
});

it("grows the marks on hover only when hover is on", () => {
  const on = render(<Brackets>a</Brackets>).container.querySelector("[data-bracket]") as HTMLElement;
  expect(on.className).toContain("group-hover/brackets:size-4");
  const off = render(<Brackets hover={false}>a</Brackets>).container.querySelector("[data-bracket]") as HTMLElement;
  expect(off.className).not.toContain("group-hover");
});

it("renders as another element when asked", () => {
  const { container } = render(<Brackets as="span">a</Brackets>);
  expect((container.firstChild as HTMLElement).tagName).toBe("SPAN");
});
