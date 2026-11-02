/**
 * Runs `start` once the poster has loaded or the browser is idle, whichever comes first,
 * so heavy fetches (the figure) never compete with the LCP image. Returns a cancel function.
 */
export function afterPoster(poster: HTMLImageElement | null, start: () => void): () => void {
  let done = false;
  let idle = 0;
  let timer = 0;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    start();
  };
  const cleanup = () => {
    poster?.removeEventListener("load", run);
    poster?.removeEventListener("error", run);
    if (idle) window.cancelIdleCallback(idle);
    if (timer) window.clearTimeout(timer);
  };

  if (poster?.complete) {
    // Already painted: no reason to wait.
    run();
    return () => {};
  }
  poster?.addEventListener("load", run);
  poster?.addEventListener("error", run);
  if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run);
  // Older Safari has no requestIdleCallback; a macrotask is the closest stand-in.
  else timer = window.setTimeout(run, 0);

  return () => {
    done = true;
    cleanup();
  };
}
