// The banned colours for tests/e2e/colors.spec.ts and one matcher for every form they can take.

/** The six old accents, the old fourth accent token, the first accent and the cream background. */
export const BANNED = [
  "#FFD23F",
  "#FF8A3D",
  "#3BCEAC",
  "#F06595",
  "#A78BFA",
  "#5AA9FF",
  "#5C7CFA",
  "#FF6B35",
  "#FFFBF5",
];

const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** `rgb(255, 210, 63)`, `rgba(255, 210, 63, 0.5)`, `rgb(255 210 63 / 50%)`: any alpha, any spacing. */
function rgbPattern(hex: string): RegExp {
  const [r, g, b] = rgbOf(hex);
  const n = (v: number) => `${v}(?:\\.0+)?`;
  return new RegExp(`rgba?\\(\\s*${n(r)}[\\s,]+${n(g)}[\\s,]+${n(b)}(?![\\d.])`, "i");
}

const PATTERNS = BANNED.map((hex) => ({ hex, rgb: rgbPattern(hex), unit: rgbOf(hex).map((c) => Math.round((c / 255) * 1000)) }));

/** `color(srgb 0.231 0.808 0.675 / 0.5)`, as Chromium prints some computed colours. */
const SRGB = /color\(\s*srgb\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/gi;

/** Every banned colour found in `text`, as hex, rgb()/rgba() with any alpha, or srgb floats rounded to 3 decimals. */
export function bannedIn(text: string): string[] {
  const hits = new Set<string>();
  const lower = text.toLowerCase();
  for (const { hex, rgb, unit } of PATTERNS) {
    if (lower.includes(hex.toLowerCase())) hits.add(hex);
    if (rgb.test(text)) hits.add(`rgb of ${hex}`);
    for (const m of text.matchAll(SRGB)) {
      const floats = [m[1], m[2], m[3]].map((v) => Math.round(Number(v) * 1000));
      if (floats.every((v, i) => v === unit[i])) hits.add(`srgb of ${hex}`);
    }
  }
  return [...hits];
}
