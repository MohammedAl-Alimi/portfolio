"use client";

import { useState } from "react";
import { Brackets } from "@/components/ui/Brackets";

const REPEATS = 6; // each half is wider than a 2560 px screen, so the loop never shows a gap

/**
 * A mono caps strip that scrolls sideways forever, with a scanline (spec 18.6).
 * Two identical halves slide by half their width, so the loop is seamless. The
 * motion is CSS (app/globals.css). It pauses on hover and with the pause button
 * (WCAG 2.2.2, for keyboard and touch), and it stays still under reduced motion,
 * where the button is hidden. The words repeat what the page says, so the
 * track is hidden from screen readers; the button is not.
 */
export function Ticker({ text }: { text: string }) {
  const [paused, setPaused] = useState(false);
  const half = Array.from({ length: REPEATS }, () => `${text} · `).join("");
  return (
    <div
      data-ticker
      data-paused={paused ? "" : undefined}
      className="relative flex items-center overflow-hidden border-y border-border bg-surface"
    >
      <div aria-hidden="true" className="min-w-0 flex-1 overflow-hidden py-3">
        <div data-ticker-track className="flex w-max">
          {[0, 1].map((i) => (
            <span key={i} className="whitespace-pre font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
              {half}
            </span>
          ))}
        </div>
      </div>
      <Brackets as="span" data-ticker-toggle className="relative z-10 mx-1 inline-flex shrink-0 bg-surface">
        <button
          type="button"
          aria-label="Pause ticker"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="inline-flex size-[44px] items-center justify-center font-mono text-[12px] font-bold text-text focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[var(--glow)]"
        >
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
        </button>
      </Brackets>
    </div>
  );
}
