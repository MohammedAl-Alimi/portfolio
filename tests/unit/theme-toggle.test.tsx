import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.className = "";
});

it("toggles the html class even when storage throws", async () => {
  const getItem = vi.fn(() => {
    throw new Error("blocked");
  });
  const setItem = vi.fn(() => {
    throw new Error("blocked");
  });
  vi.stubGlobal("localStorage", { getItem, setItem });
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  const button = screen.getByRole("button", { name: /switch to dark theme/i });
  await userEvent.click(button);
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(
    screen.getByRole("button", { name: /switch to light theme/i }),
  ).toBeInTheDocument();
  expect(getItem.mock.calls.length + setItem.mock.calls.length).toBeGreaterThan(0);
});
