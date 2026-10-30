// Count up for years and counts (spec 18.6). Pure, so it is unit tested
// (tests/unit/count-up.test.ts); components/motion/CountUp.tsx animates it.

export const COUNT_MAX_MS = 900;
const MS_PER_STEP = 60; // small counts tick, they do not blur

/** Value at progress `p` (0..1): ease-out cubic, whole numbers, exactly `target` at 1. */
export function countAt(target: number, p: number): number {
  const t = Math.min(1, Math.max(0, p));
  if (t === 1) return target;
  return Math.floor(target * (1 - (1 - t) ** 3));
}

/** Zero-padded to the target's width, so the number does not change width while it counts. */
export function formatCount(value: number, target: number): string {
  return String(value).padStart(String(target).length, "0");
}

export function countDuration(target: number): number {
  return Math.min(COUNT_MAX_MS, Math.max(0, target) * MS_PER_STEP);
}
