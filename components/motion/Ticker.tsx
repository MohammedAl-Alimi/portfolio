const REPEATS = 6; // each half is wider than a 2560 px screen, so the loop never shows a gap

/**
 * A mono caps strip that scrolls sideways forever, with a scanline (spec 18.6).
 * Two identical halves slide by half their width, so the loop is seamless. The
 * motion is CSS (app/globals.css): paused on hover, stopped under reduced motion.
 * Decorative: the words repeat what the page says, so it is hidden from screen readers.
 */
export function Ticker({ text }: { text: string }) {
  const half = Array.from({ length: REPEATS }, () => `${text} · `).join("");
  return (
    <div aria-hidden="true" data-ticker className="relative overflow-hidden border-y border-border bg-surface py-3">
      <div data-ticker-track className="flex w-max">
        {[0, 1].map((i) => (
          <span key={i} className="whitespace-pre font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            {half}
          </span>
        ))}
      </div>
    </div>
  );
}
