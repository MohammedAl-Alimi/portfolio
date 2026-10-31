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

it("renders type=button when no href", () => {
  render(<Button>Go</Button>);
  expect(screen.getByRole("button")).toHaveAttribute("type", "button");
});

it("renders mailto as a plain anchor without target", () => {
  render(<Button href="mailto:hi@example.com">Mail</Button>);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "mailto:hi@example.com");
  expect(link).not.toHaveAttribute("target");
  expect(link).not.toHaveAttribute("rel");
});

it("keeps rel noopener when an https href opens a new tab", () => {
  render(
    <Button href="https://example.com" target="_blank">
      Out
    </Button>,
  );
  expect(screen.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
});
