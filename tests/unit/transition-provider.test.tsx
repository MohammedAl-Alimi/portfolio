import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));

import { TransitionProvider, useTransition } from "@/components/motion/TransitionProvider";

const probe: { api: ReturnType<typeof useTransition> } = { api: null };
function Probe() {
  const value = useTransition();
  useEffect(() => {
    probe.api = value;
  });
  return null;
}

function overlayState() {
  return document.querySelector("[data-transition]")?.getAttribute("data-state");
}

beforeEach(() => {
  vi.useFakeTimers();
  push.mockClear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as typeof window.matchMedia;
  render(
    <TransitionProvider>
      <Probe />
      <p>page</p>
    </TransitionProvider>,
  );
});

afterEach(() => {
  vi.useRealTimers();
});

it("returns null outside the provider", () => {
  function Bare() {
    return <span data-testid="bare">{useTransition() === null ? "none" : "some"}</span>;
  }
  render(<Bare />);
  expect(screen.getByTestId("bare")).toHaveTextContent("none");
});

it("covers, pushes, and reveals when the push settles without a route change", async () => {
  expect(overlayState()).toBe("idle");
  act(() => {
    expect(probe.api?.navigate("/projects")).toBe(true);
  });
  expect(overlayState()).toBe("covering");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(push).toHaveBeenCalledWith("/projects", { scroll: false });
  // The mocked pathname never changes; the settled push alone uncovers.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(overlayState()).toBe("idle");
});

it("ignores a second navigate while covering", async () => {
  act(() => {
    probe.api?.navigate("/projects");
    probe.api?.navigate("/about");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  expect(push).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledWith("/projects", { scroll: false });
});

it("leaves same-path and external hrefs to the normal link", () => {
  act(() => {
    expect(probe.api?.navigate("/?tag=ai")).toBe(false);
    expect(probe.api?.navigate("https://example.com/x")).toBe(false);
  });
  expect(overlayState()).toBe("idle");
});

it("a popstate mid-transition clears the overlay", () => {
  act(() => {
    probe.api?.navigate("/projects");
  });
  expect(overlayState()).toBe("covering");
  act(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(overlayState()).toBe("idle");
});
