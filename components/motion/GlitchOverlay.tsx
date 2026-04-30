"use client";

import { useImperativeHandle, useRef, useSyncExternalStore, type Ref } from "react";
import type { OverlayHandle, TransitionState } from "./TransitionProvider";

/*
 * Glitch wipe (spec 18.6). Twelve horizontal bands of `bg`, each clipped with
 * clip-path, start sheared sideways by 8 to 40 px (alternating direction) and
 * fade in over 200 ms as they slide flat, so the screen is fully covered when
 * the cover ends. The uncover plays it backwards: the bands shear apart as they
 * fade out. A 6 ms stagger per band makes the wipe read as slices.
 *
 * Reduced motion: one full-screen `bg` veil fades 150 ms in and 150 ms out.
 * Animations use the Web Animations API, so nothing ticks per frame in JS.
 * Layers: nav 40, dialog 50, overlays 60, this 70.
 */

export const BAND_COUNT = 12;
const PHASE_MS = 200;
const FADE_MS = 150;
const STAGGER_MS = 6;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Band i shears 8 to 40 px; even bands go left, odd bands go right. */
export function bandShear(i: number): number {
  const direction = i % 2 ? 1 : -1;
  return direction * Math.round(8 + (i * 32) / (BAND_COUNT - 1));
}

const BANDS = Array.from({ length: BAND_COUNT }, (_, i) => {
  const top = (i * 100) / BAND_COUNT;
  const bottom = 100 - ((i + 1) * 100) / BAND_COUNT;
  return { i, clip: `inset(${top}% 0 ${bottom}% 0)`, shear: bandShear(i) };
});

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getReduced = () => window.matchMedia(QUERY).matches;
const getServerReduced = () => false;

type Step = { el: HTMLElement; frames: Keyframe[]; delay: number; duration: number };

type GlitchOverlayProps = {
  state: TransitionState;
  ref?: Ref<OverlayHandle>;
};

export function GlitchOverlay({ state, ref }: GlitchOverlayProps) {
  const reduced = useSyncExternalStore(subscribe, getReduced, getServerReduced);
  const bands = useRef<(HTMLDivElement | null)[]>([]);
  const veil = useRef<HTMLDivElement | null>(null);
  const running = useRef<Animation[]>([]);
  const phase = useRef(0);

  useImperativeHandle(ref, () => {
    function stop() {
      phase.current += 1;
      running.current.forEach((a) => a.cancel());
      running.current = [];
    }

    function hold(el: HTMLElement, frame: Keyframe) {
      el.style.opacity = String(frame.opacity ?? "");
      el.style.transform = String(frame.transform ?? "");
      el.style.willChange = "";
    }

    /** Plays every step; resolves when the slowest one ends, then holds the final frames. */
    async function play(steps: Step[]) {
      stop();
      const token = phase.current;
      const total = Math.max(0, ...steps.map((s) => s.delay + s.duration));
      if (steps.some((s) => typeof s.el.animate !== "function")) {
        await new Promise((resolve) => setTimeout(resolve, total));
      } else {
        running.current = steps.map(({ el, frames, delay, duration }) => {
          el.style.willChange = "transform, opacity";
          return el.animate(frames, { delay, duration, easing: EASE, fill: "both" });
        });
        await Promise.all(running.current.map((a) => a.finished)).catch(() => undefined);
      }
      if (phase.current !== token) return;
      steps.forEach(({ el, frames }) => hold(el, frames[frames.length - 1] ?? {}));
      running.current.forEach((a) => a.cancel());
      running.current = [];
    }

    function bandSteps(cover: boolean): Step[] {
      return BANDS.flatMap(({ i, shear }) => {
        const el = bands.current[i];
        if (!el) return [];
        const open = { opacity: 0, transform: `translateX(${shear}px)` };
        const shut = { opacity: 1, transform: "translateX(0px)" };
        const delay = (cover ? i : BAND_COUNT - 1 - i) * STAGGER_MS;
        // Every band ends at 200 ms, so the phase lasts exactly 200 ms.
        return [{ el, frames: cover ? [open, shut] : [shut, open], delay, duration: PHASE_MS - delay }];
      });
    }

    function veilSteps(cover: boolean): Step[] {
      const el = veil.current;
      if (!el) return [];
      const frames = cover ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
      return [{ el, frames, delay: 0, duration: FADE_MS }];
    }

    // The provider passes its own reduced-motion read; the rendered mode is used
    // instead, since the veil exists only when reduced motion is on.
    const steps = (cover: boolean) => (veil.current ? veilSteps(cover) : bandSteps(cover));

    return {
      cover: () => play(steps(true)),
      uncover: () => play(steps(false)),
      reset() {
        stop();
        [...bands.current, veil.current].forEach((el) => {
          if (el) hold(el, { opacity: 0, transform: "" });
        });
      },
    };
  }, []);

  const busy = state !== "idle";

  return (
    <div
      aria-hidden="true"
      data-transition=""
      data-state={state}
      className="fixed inset-0 z-[70] overflow-hidden"
      style={{ pointerEvents: busy ? "auto" : "none" }}
    >
      {reduced ? (
        <div ref={veil} data-glitch-fade="" className="absolute inset-0 bg-bg opacity-0" />
      ) : (
        BANDS.map(({ i, clip }) => (
          <div
            key={i}
            ref={(el) => {
              bands.current[i] = el;
            }}
            data-glitch-band=""
            className="absolute inset-0 bg-bg opacity-0"
            style={{ clipPath: clip }}
          />
        ))
      )}
    </div>
  );
}
