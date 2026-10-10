// Usage: node scripts/make-poster.mjs [out.webp]
// Builds the hero poster: 8 soft candy shapes on a transparent 1600x1200 canvas.
// The layout is hard-coded, so the output is deterministic.
import sharp from "sharp";

const out = process.argv[2] ?? "public/posters/cluster.webp";
const W = 1600;
const H = 1200;
const COLORS = ["#FF6B35", "#FFD23F", "#3BCEAC", "#5C7CFA", "#F06595", "#A78BFA"];

function tint(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r},${g},${b})`;
}

// type, cx, cy, size, rotation in degrees
const SHAPES = [
  ["circle", 500, 430, 420, 0],
  ["square", 890, 360, 340, 12],
  ["ring", 1250, 420, 300, 0],
  ["capsule", 1010, 650, 420, -15],
  ["circle", 330, 770, 260, 0],
  ["triangle", 690, 790, 380, 8],
  ["square", 1280, 830, 250, -10],
  ["circle", 1050, 960, 220, 0],
];

function geometry(type, size, paint, extra = "") {
  const s = size;
  switch (type) {
    case "circle":
      return `<circle cx="0" cy="0" r="${s / 2}" ${paint} ${extra}/>`;
    case "square":
      return `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * 0.18}" ${paint} ${extra}/>`;
    case "capsule":
      return `<rect x="${-s / 2}" y="${-s * 0.24}" width="${s}" height="${s * 0.48}" rx="${s * 0.24}" ${paint} ${extra}/>`;
    case "ring": {
      const sw = s * 0.26;
      return `<circle cx="0" cy="0" r="${(s - sw) / 2}" fill="none" stroke-width="${sw}" ${paint} ${extra}/>`;
    }
    case "triangle": {
      const sw = 56;
      const h = (s - sw) / 2;
      return `<polygon points="0,${-h} ${h},${h * 0.8} ${-h},${h * 0.8}" stroke-linejoin="round" stroke-width="${sw}" ${paint} ${extra}/>`;
    }
    default:
      throw new Error(`Unknown shape ${type}`);
  }
}

// Paint attributes: fill-based shapes use fill and a matching stroke for the triangle.
function paintFor(type, ref) {
  if (type === "ring") return `stroke="${ref}"`;
  if (type === "triangle") return `fill="${ref}" stroke="${ref}"`;
  return `fill="${ref}"`;
}

const defs = [
  `<filter id="shadow" x="-40%" y="-40%" width="180%" height="190%">
    <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000" flood-opacity="0.18"/>
  </filter>`,
  `<radialGradient id="rim" cx="0.35" cy="0.35" r="0.75">
    <stop offset="0.7" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.06"/>
  </radialGradient>`,
];

const body = SHAPES.map(([type, cx, cy, size, rot], i) => {
  const base = COLORS[i % COLORS.length];
  defs.push(
    `<radialGradient id="g${i}" cx="0.3" cy="0.3" r="0.85">
      <stop offset="0" stop-color="${tint(base, 0.35)}"/>
      <stop offset="1" stop-color="${base}"/>
    </radialGradient>`,
  );
  const main = geometry(type, size, paintFor(type, `url(#g${i})`));
  // The triangle uses a wide stroke, so a second pass would double up inside the stroke.
  const rim = type === "triangle" ? "" : geometry(type, size, paintFor(type, "url(#rim)"));
  return `<g filter="url(#shadow)"><g transform="translate(${cx} ${cy}) rotate(${rot})">${main}${rim}</g></g>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${defs.join("\n")}</defs>
${body}
</svg>`;

await sharp(Buffer.from(svg)).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
console.log(`wrote ${out}`);
