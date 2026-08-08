"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useMarkReady } from "./ready";

// Stand-in until real scenes call useMarkReady themselves (hero, Task 3).
// With frameloop="demand" nothing draws, so ask for one frame.
export function ReadyProbe() {
  const invalidate = useThree((s) => s.invalidate);
  useMarkReady();
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}
