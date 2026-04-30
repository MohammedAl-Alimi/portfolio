"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition as useReactTransition,
  type ReactNode,
} from "react";
import { scrollToTop } from "@/lib/scroll";

/*
 * Page transitions (spec 18.6). One provider in the root layout runs a small
 * state machine: idle → covering (200 ms) → route → uncovering (200 ms) → idle.
 *
 * - A click while covering is ignored. A click while uncovering is queued; the
 *   last one wins and runs once the overlay is idle.
 * - A 1.5 s watchdog forces idle and clears the overlay whatever happens
 *   (slow route, failed push, a route that never changes the pathname).
 * - A link to the current pathname (a filter chip, the active tab) skips the
 *   wipe: there is no new page to reveal.
 * - Back and forward never animate. A popstate mid-transition cancels it.
 */

export type TransitionState = "idle" | "covering" | "uncovering";

export const COVER_MS = 200;
export const UNCOVER_MS = 200;
export const WATCHDOG_MS = 1500;

/** What the overlay exposes to the provider. Each phase resolves when its animation ends. */
export interface OverlayHandle {
  cover(reduced: boolean): Promise<void>;
  uncover(reduced: boolean): Promise<void>;
  /** Cancels any animation and hides the overlay at once. */
  reset(): void;
}

type TransitionContextValue = {
  state: TransitionState;
  /** Starts a wiped navigation. Returns false when the caller should navigate normally. */
  navigate: (href: string) => boolean;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

/** The transition state and `navigate`, or null outside the provider (tests, isolated renders). */
export function useTransition(): TransitionContextValue | null {
  return useContext(TransitionContext);
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type Run = {
  id: number;
  fromPath: string;
  reduced: boolean;
  /** Set once router.push has been called. */
  pushed: boolean;
};

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setStateValue] = useState<TransitionState>("idle");
  const [isPending, startTransition] = useReactTransition();

  const stateRef = useRef<TransitionState>("idle");
  const runRef = useRef<Run | null>(null);
  const nextId = useRef(0);
  const queued = useRef<string | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlay = useRef<OverlayHandle | null>(null);
  const pathnameRef = useRef(pathname);
  const navigateRef = useRef<(href: string) => boolean>(() => false);

  const setState = useCallback((next: TransitionState) => {
    stateRef.current = next;
    setStateValue(next);
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = null;
  }, []);

  /** Back to idle. Moves focus to the new page when the route changed. */
  const settle = useCallback(
    (moved: boolean) => {
      clearWatchdog();
      runRef.current = null;
      setState("idle");
      if (moved) document.getElementById("main")?.focus({ preventScroll: true });
      const next = queued.current;
      queued.current = null;
      if (next && !navigateRef.current(next)) router.push(next);
    },
    [clearWatchdog, router, setState],
  );

  /** Ends the transition now, wherever it is. Used by the watchdog and popstate. */
  const forceIdle = useCallback(() => {
    const run = runRef.current;
    if (!run && stateRef.current === "idle") return;
    overlay.current?.reset();
    settle(Boolean(run && pathnameRef.current !== run.fromPath));
  }, [settle]);

  const uncover = useCallback(async () => {
    const run = runRef.current;
    if (!run || stateRef.current !== "covering") return;
    setState("uncovering");
    await (overlay.current?.uncover(run.reduced) ?? wait(UNCOVER_MS));
    if (runRef.current?.id !== run.id) return;
    settle(pathnameRef.current !== run.fromPath);
  }, [setState, settle]);

  const navigate = useCallback(
    (href: string): boolean => {
      if (typeof window === "undefined") return false;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (stateRef.current === "covering") return true;
      if (stateRef.current === "uncovering") {
        queued.current = href;
        return true;
      }
      // Same pathname (query or hash change only): a normal navigation, no wipe.
      if (url.pathname === window.location.pathname) return false;

      const run: Run = {
        id: ++nextId.current,
        fromPath: pathnameRef.current,
        reduced: prefersReducedMotion(),
        pushed: false,
      };
      runRef.current = run;
      setState("covering");
      clearWatchdog();
      watchdog.current = setTimeout(forceIdle, WATCHDOG_MS);

      void (async () => {
        await (overlay.current?.cover(run.reduced) ?? wait(COVER_MS));
        if (runRef.current?.id !== run.id) return;
        // Jump to the top while covered, so the new page never shows mid-scroll.
        scrollToTop();
        run.pushed = true;
        // A link to a section of another page keeps Next's scroll to the hash.
        const scroll = url.hash !== "";
        startTransition(() => router.push(href, { scroll }));
      })();
      return true;
    },
    [clearWatchdog, forceIdle, router, setState, startTransition],
  );

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // The new page has committed: reveal it.
  useEffect(() => {
    pathnameRef.current = pathname;
    const run = runRef.current;
    if (run?.pushed && pathname !== run.fromPath) void uncover();
  }, [pathname, uncover]);

  // The push settled without a pathname change (redirect back, failed fetch): reveal anyway.
  useEffect(() => {
    const run = runRef.current;
    if (!isPending && run?.pushed && stateRef.current === "covering") void uncover();
  }, [isPending, uncover]);

  // Back and forward never animate; one arriving mid-transition cancels it.
  useEffect(() => {
    const onPop = () => {
      queued.current = null;
      forceIdle();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) forceIdle();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pageshow", onShow);
    };
  }, [forceIdle]);

  // Only on unmount: a re-render must never cancel a running watchdog.
  useEffect(() => clearWatchdog, [clearWatchdog]);

  const value = useMemo(() => ({ state, navigate }), [state, navigate]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div
        aria-hidden="true"
        data-transition=""
        data-state={state}
        className="fixed inset-0 z-[70] bg-bg"
        style={{ opacity: state === "idle" ? 0 : 1, pointerEvents: state === "idle" ? "none" : "auto" }}
      />
    </TransitionContext.Provider>
  );
}
