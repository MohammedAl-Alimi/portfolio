"use client";

import { useEffect } from "react";
import {
  clientToSlot,
  pointerVelocity,
  smoothPointer,
  stormNow,
  windTrail,
  type Vec,
} from "@/lib/pointer-force";
import { useSceneStore } from "@/lib/scene-store";

// Turns pointer moves over the slot into wind samples. Listens on the slot,
// not the window, so the storm only reacts to a pointer that is over it.
// At most one sample per animation frame, spaced further by the trail itself.
export function usePointerForce(selector: string | undefined, enabled = true): void {
  useEffect(() => {
    const slot = selector && enabled ? document.querySelector<HTMLElement>(selector) : null;
    if (!slot) return;
    let raf = 0;
    let pending: { clientX: number; clientY: number } | null = null;
    let smoothed: Vec | null = null;
    let lastT = 0;

    const flush = () => {
      raf = 0;
      if (!pending) return;
      const target = clientToSlot(pending.clientX, pending.clientY, slot.getBoundingClientRect());
      pending = null;
      const t = stormNow();
      if (!smoothed) {
        // The first sample has no history, so it carries no speed.
        smoothed = target;
        lastT = t;
        return;
      }
      const dt = t - lastT;
      const next = smoothPointer(smoothed, target, dt);
      const v = pointerVelocity(smoothed, next, dt);
      smoothed = next;
      lastT = t;
      windTrail.push({ x: next.x, y: next.y, vx: v.vx, vy: v.vy, t });
      useSceneStore.getState().setPointer({ x: next.x, y: next.y, vx: v.vx, vy: v.vy });
    };

    const onMove = (e: PointerEvent) => {
      pending = { clientX: e.clientX, clientY: e.clientY };
      if (!raf) raf = requestAnimationFrame(flush);
    };

    // One last sample with no speed, so the field fades from where the pointer left.
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      pending = null;
      if (smoothed) {
        windTrail.push({ x: smoothed.x, y: smoothed.y, vx: 0, vy: 0, t: stormNow() }, true);
        useSceneStore.getState().setPointer({ x: smoothed.x, y: smoothed.y, vx: 0, vy: 0 });
      }
      smoothed = null;
    };

    slot.addEventListener("pointermove", onMove, { passive: true });
    slot.addEventListener("pointerleave", onLeave);
    // A vertical swipe hands the touch to scrolling, which cancels the pointer.
    slot.addEventListener("pointercancel", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      slot.removeEventListener("pointermove", onMove);
      slot.removeEventListener("pointerleave", onLeave);
      slot.removeEventListener("pointercancel", onLeave);
    };
  }, [selector, enabled]);
}
