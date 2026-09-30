import { afterEach, describe, expect, it, vi } from "vitest";
import { setSmoothScroller, subscribeScroll, type SmoothScroller } from "@/lib/scroll";

function fakeLenis(scroll: number, limit: number) {
  let cb: ((l: SmoothScroller) => void) | null = null;
  const l = {
    scroll,
    limit,
    on: (_e: "scroll", fn: (l: SmoothScroller) => void) => {
      cb = fn;
      return () => {
        cb = null;
      };
    },
    fire: () => cb?.(l),
    get attached() {
      return cb !== null;
    },
  };
  return l;
}

describe("scroll bus", () => {
  afterEach(() => setSmoothScroller(null));

  it("calls a new subscriber with the current native position", () => {
    const fn = vi.fn();
    const off = subscribeScroll(fn);
    expect(fn).toHaveBeenCalledWith({ y: 0, progress: 0 });
    off();
  });

  it("follows the smooth scroller while one is set, and stops on unsubscribe", () => {
    const fn = vi.fn();
    const off = subscribeScroll(fn);
    const lenis = fakeLenis(300, 1200);
    setSmoothScroller(lenis);
    expect(fn).toHaveBeenLastCalledWith({ y: 300, progress: 0.25 });
    lenis.scroll = 600;
    lenis.fire();
    expect(fn).toHaveBeenLastCalledWith({ y: 600, progress: 0.5 });
    off();
    fn.mockClear();
    lenis.fire();
    expect(fn).not.toHaveBeenCalled();
  });

  it("reads 0 progress on a page that cannot scroll", () => {
    const fn = vi.fn();
    const off = subscribeScroll(fn);
    setSmoothScroller(fakeLenis(0, 0));
    expect(fn).toHaveBeenLastCalledWith({ y: 0, progress: 0 });
    off();
  });

  it("detaches from the smooth scroller when it is cleared", () => {
    const off = subscribeScroll(() => {});
    const lenis = fakeLenis(0, 0);
    setSmoothScroller(lenis);
    expect(lenis.attached).toBe(true);
    setSmoothScroller(null);
    expect(lenis.attached).toBe(false);
    off();
  });
});
