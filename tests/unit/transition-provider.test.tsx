import { act, render, screen } from "@testing-library/react";
import { Suspense, use, useEffect, useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const push = vi.fn();
const nav = vi.hoisted(() => ({ path: "/" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => nav.path,
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

// Test seams. `rerender` re-renders the provider so it reads nav.path again.
// `slowPush` acts like Next loading a route: inside the push's transition it
// re-renders the provider and suspends on a gate; `arrive(path)` sets the new
// pathname and opens the gate, so the transition commits with the new page.
const harness: { rerender: () => void; hang: () => void } = { rerender: () => {}, hang: () => {} };
let gate: { promise: Promise<void>; open: () => void };
function newGate() {
  let open = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

function Hang() {
  const [hung, setHung] = useState(false);
  useEffect(() => {
    harness.hang = () => setHung(true);
  });
  if (hung) use(gate.promise);
  return null;
}

function slowPush() {
  harness.rerender();
  harness.hang();
}

async function arrive(path: string) {
  await act(async () => {
    nav.path = path;
    gate.open();
  });
}

function Harness() {
  const [, setTick] = useState(0);
  useEffect(() => {
    harness.rerender = () => setTick((t) => t + 1);
  });
  return (
    <TransitionProvider>
      <Probe />
      <Suspense fallback={null}>
        <Hang />
      </Suspense>
      <main id="main" tabIndex={-1}>
        page
      </main>
    </TransitionProvider>
  );
}

function overlayState() {
  return document.querySelector("[data-transition]")?.getAttribute("data-state");
}

beforeEach(() => {
  vi.useFakeTimers();
  push.mockReset();
  nav.path = "/";
  gate = newGate();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as typeof window.matchMedia;
  render(<Harness />);
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

it("waits for the new pathname before scrolling to the top", async () => {
  // The route is still loading after the push.
  push.mockImplementation(slowPush);
  act(() => {
    probe.api?.navigate("/projects");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(push).toHaveBeenCalledTimes(1);
  expect(overlayState()).toBe("covering");
  // The old page must not move while the new one loads.
  expect(window.scrollTo).not.toHaveBeenCalled();
  await arrive("/projects");
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  expect(overlayState()).toBe("uncovering");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(overlayState()).toBe("idle");
  expect(document.activeElement?.id).toBe("main");
});

it("after the watchdog, a late page still scrolls to the top and gets focus", async () => {
  // A slow route: the page has not arrived when the watchdog fires.
  push.mockImplementation(slowPush);
  act(() => {
    probe.api?.navigate("/projects");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(WATCHDOG_MS);
  });
  expect(push).toHaveBeenCalledTimes(1);
  expect(overlayState()).toBe("idle");
  // The old page is revealed where it was: no scroll, focus untouched.
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(document.activeElement?.id).not.toBe("main");
  // The page lands later.
  await arrive("/projects");
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  expect(document.activeElement?.id).toBe("main");
});

it("when the watchdog fires after the page arrived, focus moves at once", async () => {
  // The page arrives with the push, but the reveal animation never ends.
  let calls = 0;
  const original = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = vi.fn(() => {
    calls += 1;
    return { finished: calls <= 12 ? Promise.resolve() : new Promise(() => {}), cancel: vi.fn() };
  }) as unknown as typeof HTMLElement.prototype.animate;
  push.mockImplementation(() => {
    nav.path = "/projects";
    harness.rerender();
  });
  try {
    act(() => {
      probe.api?.navigate("/projects");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(WATCHDOG_MS - 1);
    });
    expect(overlayState()).toBe("uncovering");
    expect(document.activeElement?.id).not.toBe("main");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(overlayState()).toBe("idle");
    expect(document.activeElement?.id).toBe("main");
  } finally {
    HTMLElement.prototype.animate = original;
  }
});

it("a back after the watchdog cancels the late-arrival handling", async () => {
  push.mockImplementation(slowPush);
  act(() => {
    probe.api?.navigate("/projects");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(WATCHDOG_MS);
  });
  act(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
    nav.path = "/about";
    harness.rerender();
  });
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(document.activeElement?.id).not.toBe("main");
});
