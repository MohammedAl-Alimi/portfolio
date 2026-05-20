import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Shared frame for the Open Graph images (app/opengraph-image.tsx and the project route).
// Monolith palette only: black, a grey rule, white title, grey mono subtitle, scanlines.
export const OG_SIZE = { width: 1200, height: 630 };

const BG = "#050505";
const TEXT = "#f2f2f0";
const MUTED = "#808086";
const BORDER = "#2a2a2e";
const SCANLINE = "rgba(255,255,255,0.06)";
const SCANLINE_ROWS = Array.from({ length: Math.ceil(OG_SIZE.height / 4) }, (_, i) => i);

/** Static TTFs vendored from Google Fonts (SIL OFL 1.1, licences beside them). Satori cannot read woff2. */
export async function ogFonts() {
  const dir = path.join(process.cwd(), "app/fonts/og");
  const [syne, mono] = await Promise.all([
    readFile(path.join(dir, "Syne-ExtraBold.ttf")),
    readFile(path.join(dir, "JetBrainsMono-Regular.ttf")),
  ]);
  return [
    { name: "Syne", data: syne, weight: 800 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

interface FrameProps {
  /** One entry per line. */
  title: string[];
  subtitle: string;
  wordmark: string;
}

export function OgFrame({ title, subtitle, wordmark }: FrameProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        backgroundColor: BG,
        color: TEXT,
        fontFamily: "JetBrains Mono",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {title.map((line) => (
          <div
            key={line}
            style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 88, lineHeight: 0.95, letterSpacing: -3 }}
          >
            {line}
          </div>
        ))}
        <div style={{ width: 120, height: 2, backgroundColor: BORDER, marginTop: 40, marginBottom: 32 }} />
        <div style={{ fontSize: 30, color: MUTED, maxWidth: 900, lineHeight: 1.35 }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: TEXT }}>
        {wordmark}
      </div>
      {/* Satori draws no repeating gradients, so the scanlines are 1 px rows every 4 px. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {SCANLINE_ROWS.map((row) => (
          <div key={row} style={{ width: "100%", height: 1, marginBottom: 3, flexShrink: 0, backgroundColor: SCANLINE }} />
        ))}
      </div>
    </div>
  );
}
