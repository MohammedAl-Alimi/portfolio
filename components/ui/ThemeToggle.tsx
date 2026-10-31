"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-border bg-surface text-text transition-colors duration-(--motion-fast) hover:border-accent-1"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
