import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "@/components/ui/Button";

it("renders an internal link for href", () => {
  render(<Button href="/projects">See projects</Button>);
  expect(screen.getByRole("link", { name: "See projects" })).toHaveAttribute(
    "href",
    "/projects",
  );
});

it("adds rel noopener for external links", () => {
  render(
    <Button href="https://github.com/x" external>
      GitHub
    </Button>,
  );
  expect(screen.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
});

it("renders a button when no href", () => {
  render(<Button onClick={() => {}}>Go</Button>);
  expect(screen.getByRole("button")).toBeInTheDocument();
});
