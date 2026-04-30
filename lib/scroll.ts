// One scroll feed for everything scroll-driven (rail readout, grid floor, figure orbit).
// While Lenis runs (components/motion/SmoothScroll.tsx) it is the source, so the
// values follow the smoothed position; otherwise native scroll events feed it.

export interface ScrollState {
  /** Scroll position in CSS px. */
  y: number;
  /** 0 at the top, 1 at the bottom. 0 when the page cannot scroll. */
  progress: number;
}

/** The part of Lenis this module uses. */
export interface SmoothScroller {
  readonly scroll: number;
  readonly limit: number;
  on(event: "scroll", callback: (scroller: SmoothScroller) => void): () => void;
  scrollTo?(target: number, options?: { immediate?: boolean; force?: boolean }): void;
}

type Listener = (state: ScrollState) => void;

const listeners = new Set<Listener>();
let scroller: SmoothScroller | null = null;
let detachScroller: (() => void) | null = null;
let frame = 0;

function progressOf(y: number, max: number): number {
  return max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
}

function read(): ScrollState {
  if (scroller) return { y: scroller.scroll, progress: progressOf(scroller.scroll, scroller.limit) };
  const el = document.documentElement;
  const y = window.scrollY;
  return { y, progress: progressOf(y, el.scrollHeight - el.clientHeight) };
}

function emit() {
  const state = read();
  listeners.forEach((fn) => fn(state));
}

// Native events are batched to one emit per frame. Lenis already emits once per frame.
function onNative() {
  if (scroller || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    emit();
  });
}

function attach() {
  window.addEventListener("scroll", onNative, { passive: true });
  window.addEventListener("resize", onNative);
  if (scroller) detachScroller = scroller.on("scroll", emit);
}

function detach() {
  window.removeEventListener("scroll", onNative);
  window.removeEventListener("resize", onNative);
  detachScroller?.();
  detachScroller = null;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

/** Calls `fn` now with the current position, then on every scroll. Returns the unsubscribe. */
export function subscribeScroll(fn: Listener): () => void {
  if (listeners.size === 0) attach();
  listeners.add(fn);
  fn(read());
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) detach();
  };
}

/** Lenis registers itself here while it runs, and clears itself (null) when it stops. */
export function setSmoothScroller(next: SmoothScroller | null): void {
  detachScroller?.();
  detachScroller = null;
  scroller = next;
  if (listeners.size > 0) {
    if (scroller) detachScroller = scroller.on("scroll", emit);
    emit();
  }
}

/** Jumps to the top with no glide: through Lenis while it runs, natively otherwise. */
export function scrollToTop(): void {
  if (scroller?.scrollTo) scroller.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}
