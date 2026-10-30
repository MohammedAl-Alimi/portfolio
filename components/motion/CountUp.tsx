"use client";

import { useEffect, useRef } from "react";
import { countAt, countDuration, formatCount } from "@/lib/count-up";

interface Props {
  value: number;
  className?: string;
}

/**
 * A whole number that counts up from zero when it enters the viewport (spec 18.6).
 * The final value is in the server HTML and in a visually hidden copy for screen
 * readers; the counting digits are an aria-hidden layer. Reduced motion: no count.
 */
export function CountUp({ value, className }: Props) {
  const digits = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = digits.current;
    const duration = countDuration(value);
    if (!el || duration === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        let start = -1;
        const step = (now: number) => {
          if (start < 0) start = now;
          const p = (now - start) / duration;
          el.textContent = formatCount(countAt(value, p), value);
          if (p < 1) raf = requestAnimationFrame(step);
          else el.dataset.countUp = "done";
        };
        el.dataset.countUp = "run";
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = String(value);
    };
  }, [value]);

  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      <span ref={digits} aria-hidden="true" data-count-up="" className="tabular-nums">
        {value}
      </span>
    </span>
  );
}
