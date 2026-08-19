"use client";

import { View } from "@react-three/drei";
import type { ReactNode, RefObject } from "react";

interface Props {
  track: RefObject<HTMLElement | null>;
  index?: number;
  children: ReactNode;
}

// Kept apart from ViewSlot so drei stays out of pages until a canvas is active.
export default function ViewTrack({ track, index, children }: Props) {
  return (
    <View track={track as RefObject<HTMLElement>} index={index}>
      {children}
    </View>
  );
}
