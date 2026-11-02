import { afterEach, describe, expect, it, vi } from "vitest";
import { afterPoster } from "@/lib/after-poster";

function poster(complete: boolean): HTMLImageElement {
  const img = document.createElement("img");
  Object.defineProperty(img, "complete", { value: complete });
  return img;
}

describe("afterPoster", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts at once when the poster has already loaded", () => {
    const start = vi.fn();
    afterPoster(poster(true), start);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("waits for the poster load event", () => {
    vi.stubGlobal("requestIdleCallback", vi.fn(() => 1));
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    const start = vi.fn();
    const img = poster(false);
    afterPoster(img, start);
    expect(start).not.toHaveBeenCalled();
    img.dispatchEvent(new Event("load"));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("starts on idle if that comes first, and only once", () => {
    let idle: () => void = () => {};
    vi.stubGlobal(
      "requestIdleCallback",
      vi.fn((cb: () => void) => {
        idle = cb;
        return 1;
      }),
    );
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    const start = vi.fn();
    const img = poster(false);
    afterPoster(img, start);
    idle();
    img.dispatchEvent(new Event("load"));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("never starts after cancel", () => {
    vi.stubGlobal("requestIdleCallback", vi.fn(() => 1));
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    const start = vi.fn();
    const img = poster(false);
    const cancel = afterPoster(img, start);
    cancel();
    img.dispatchEvent(new Event("load"));
    expect(start).not.toHaveBeenCalled();
  });
});
