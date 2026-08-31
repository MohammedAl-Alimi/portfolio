"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { smoothPointer, pointerVelocity, stormNow, tiltToPointer, windTrail, type Vec } from "@/lib/pointer-force";
import { useSceneStore } from "@/lib/scene-store";

type PermissionFn = () => Promise<"granted" | "denied" | "default">;
type Permission = "unsupported" | "needs-tap" | "open";

const TILT_HZ = 20;
const MIN_CHANGE_DEG = 0.5;
// The virtual pointer drifts toward the tilt, slower than a mouse.
const TILT_TAU = 0.25;

function readPermission(): Permission {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") return "unsupported";
  if (!window.matchMedia("(pointer: coarse)").matches) return "unsupported";
  const request = (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;
  return typeof request === "function" ? "needs-tap" : "open";
}

const noSubscribe = () => () => {};

export interface TiltForce {
  /** True when a tap is needed before tilt can work (iOS). */
  needsTap: boolean;
  /** Asks for motion permission. Call it from a tap. */
  enable: () => void;
}

// Device tilt moves a virtual pointer across the slot, which feeds the same
// wind trail as the mouse. Touch devices only. iOS asks for permission first.
export function useTiltForce(active: boolean): TiltForce {
  const permission = useSyncExternalStore(noSubscribe, readPermission, () => "unsupported" as Permission);
  const [answer, setAnswer] = useState<"none" | "granted" | "denied">("none");
  const listening = active && (permission === "open" || (permission === "needs-tap" && answer === "granted"));

  useEffect(() => {
    if (!listening) return;
    let baseBeta: number | null = null;
    let lastPush = -Infinity;
    let lastGamma = Number.NaN;
    let lastBeta = Number.NaN;
    let smoothed: Vec | null = null;
    let lastT = 0;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      // However the phone is held when tilt starts counts as level.
      if (baseBeta === null) baseBeta = e.beta;
      const t = stormNow();
      if (t - lastPush < 1 / TILT_HZ) return;
      if (Math.abs(e.gamma - lastGamma) <= MIN_CHANGE_DEG && Math.abs(e.beta - lastBeta) <= MIN_CHANGE_DEG) return;
      lastGamma = e.gamma;
      lastBeta = e.beta;
      lastPush = t;
      useSceneStore.getState().markInteracted();
      // Tipping the top edge away lowers beta and moves the pointer up.
      const target = tiltToPointer(e.gamma, baseBeta - e.beta);
      if (!smoothed) {
        smoothed = target;
        lastT = t;
        return;
      }
      const dt = t - lastT;
      const next = smoothPointer(smoothed, target, dt, TILT_TAU);
      // Speed follows how fast the tilt changes.
      const v = pointerVelocity(smoothed, next, dt);
      smoothed = next;
      lastT = t;
      windTrail.push({ x: next.x, y: next.y, vx: v.vx, vy: v.vy, t }, true);
      useSceneStore.getState().setPointer({ x: next.x, y: next.y, vx: v.vx, vy: v.vy });
    };

    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [listening]);

  const enable = useCallback(() => {
    const request = (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;
    if (typeof request !== "function") return;
    request()
      .then((r) => setAnswer(r === "granted" ? "granted" : "denied"))
      .catch(() => setAnswer("denied"));
  }, []);

  return { needsTap: active && permission === "needs-tap" && answer === "none", enable };
}
