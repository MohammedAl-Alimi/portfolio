// Text decode: random glyphs that resolve into the text, left to right.
// Pure, so the animation is unit tested (tests/unit/decode.test.ts).

export const GLYPHS = "█▓▒░<>/\\|_-=+*#01";

/**
 * One frame of the decode. `progress` 0 shows only glyphs, 1 shows the text.
 * The first floor(progress * length) characters are resolved; spaces always stay spaces.
 */
export function decodeFrame(text: string, progress: number, rng: () => number): string {
  const chars = Array.from(text);
  const p = Math.min(1, Math.max(0, progress));
  const resolved = Math.floor(p * chars.length);
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i] ?? "";
    if (i < resolved || c === " ") out += c;
    else out += GLYPHS[Math.floor(rng() * GLYPHS.length)] ?? "█";
  }
  return out;
}

/** Total decode time in ms: charMs per character, at most maxMs. */
export function decodeDuration(length: number, charMs: number, maxMs: number): number {
  return Math.min(maxMs, length * charMs);
}
