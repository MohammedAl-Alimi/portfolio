import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));

import { bandShear } from "@/components/motion/GlitchOverlay";
import { TransitionProvider, WATCHDOG_MS, useTransition } from "@/components/motion/TransitionProvider";

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

it("renders 12 glitch bands with alternating 8 to 40 px shears", () => {
  expect(document.querySelectorAll("[data-glitch-band]")).toHaveLength(12);
  expect(document.querySelector("[data-glitch-fade]")).toBeNull();
  expect(Array.from({ length: 12 }, (_, i) => bandShear(i))).toEqual([
    -8, 11, -14, 17, -20, 23, -25, 28, -31, 34, -37, 40,
  ]);
});

it("the watchdog forces idle at 1.5 s when the cover never finishes", async () => {
  // Animations that never end: only the watchdog can clear the overlay.
  const stuck = () => ({ finished: new Promise(() => {}), cancel: vi.fn() });
  const original = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = vi.fn(stuck) as unknown as typeof HTMLElement.prototype.animate;
  try {
    act(() => {
      probe.api?.navigate("/projects");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(WATCHDOG_MS - 1);
    });
    expect(overlayState()).toBe("covering");
    expect(push).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(overlayState()).toBe("idle");
    const band = document.querySelector<HTMLElement>("[data-glitch-band]");
    expect(band?.style.opacity).toBe("0");
  } finally {
    HTMLElement.prototype.animate = original;
  }
});

it("queues clicks during the reveal; the last one runs after idle", async () => {
  act(() => {
    probe.api?.navigate("/projects");
  });
  // Cover 200 ms, then the mocked push settles at once and the reveal starts.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(overlayState()).toBe("uncovering");
  act(() => {
    expect(probe.api?.navigate("/lab")).toBe(true);
    expect(probe.api?.navigate("/about")).toBe(true);
  });
  expect(push).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  // Idle, then the queued href starts its own wipe.
  expect(overlayState()).toBe("covering");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(push.mock.calls.map((call) => call[0])).toEqual(["/projects", "/about"]);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  expect(overlayState()).toBe("idle");
});

it("a queued same-path href falls back to a plain push", async () => {
  act(() => {
    probe.api?.navigate("/projects");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(overlayState()).toBe("uncovering");
  act(() => {
    probe.api?.navigate("/?tag=ai");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(overlayState()).toBe("idle");
  expect(push.mock.calls.map((call) => call[0])).toEqual(["/projects", "/?tag=ai"]);
});
