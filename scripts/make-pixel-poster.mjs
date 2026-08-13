// Usage: node scripts/make-pixel-poster.mjs [out.webp]
// Renders public/posters/pixel-name.webp: the pixel storm's word, drawn as the
// same coloured squares, on a transparent 1600x900 canvas.
//
// Node has no Unbounded font and no 2D canvas, so the drawing happens in
// headless Chromium (installed with Playwright). The sampler and the colour
// code are the real modules from lib/, transpiled with TypeScript and run in
// the page, so the poster matches the live storm.
//
// One-off font fetch: the first run downloads the Unbounded 700 latin woff2
// from Google Fonts (SIL OFL) into the OS temp directory, never into the repo.
// Set FONT_CACHE to use another directory.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import ts from "typescript";

const out = process.argv[2] ?? "public/posters/pixel-name.webp";
const W = 1600;
const H = 900;
const COUNT = 40000;
const MARGIN = 0.08;
// Live storm on desktop: point size slotHeight / 180 (2.9 px) in a 580 px wide slot.
const POINT = (W * (520 / 180)) / 580;
const MAX_BYTES = 120 * 1024;
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

async function fontFile() {
  const dir = process.env.FONT_CACHE ?? os.tmpdir();
  const file = path.join(dir, "unbounded-700-latin.woff2");
  if (fs.existsSync(file)) return file;
  const css = await (
    await fetch("https://fonts.googleapis.com/css2?family=Unbounded:wght@700", {
      headers: { "User-Agent": CHROME_UA },
    })
  ).text();
  const latin = css.split("/* latin */")[1] ?? css;
  const url = latin.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)?.[1];
  if (!url) throw new Error("Unbounded woff2 URL not found in the Google Fonts CSS");
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, buf);
  return file;
}

function transpile(file) {
  const src = fs.readFileSync(file, "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // The modules are inlined into one script, so drop imports and exports.
  return js.replace(/^import .*$/gm, "").replace(/^export /gm, "");
}

const code = [transpile("lib/pixel-sampler.ts"), transpile("lib/storm-attributes.ts")].join("\n");
const font = fs.readFileSync(await fontFile()).toString("base64");

const html = `<!doctype html><html><head><style>
@font-face { font-family: Unbounded; font-weight: 700; src: url(data:font/woff2;base64,${font}) format("woff2"); }
body { margin: 0; background: transparent; }
</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>
${code}
window.render = async function () {
  await document.fonts.load("700 200px Unbounded");
  if (!document.fonts.check("700 200px Unbounded")) throw new Error("font not loaded");
  const getContext = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c.getContext("2d", { willReadFrequently: true });
  };
  const raw = sampleTextToCount("MOHAMMED", { font: "700 220px Unbounded", width: 1600, height: 600, count: ${COUNT}, getContext });
  const targets = fitToCount(centerAndFit(raw), ${COUNT});
  const a = buildStormAttributes(targets, ${COUNT}, STORM_COLORS);
  const ctx = document.getElementById("c").getContext("2d");
  const zoom = (${W} * (1 - ${MARGIN})) / 2;
  const to255 = (v) => Math.round(Math.min(1, v) * 255);
  for (let i = 0; i < ${COUNT}; i++) {
    const x = ${W} / 2 + a.aTarget[i * 3] * zoom;
    const y = ${H} / 2 - a.aTarget[i * 3 + 1] * zoom;
    // Same size jitter as the vertex shader.
    const seed = a.aSeed[i];
    const s = ${POINT} * (0.7 + 0.6 * ((seed * 7.31) % 1));
    const r = a.aColor[i * 3], g = a.aColor[i * 3 + 1], b = a.aColor[i * 3 + 2];
    ctx.fillStyle = "rgb(" + to255(r * 0.85) + "," + to255(g * 0.85) + "," + to255(b * 0.85) + ")";
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    const inset = s * 0.1;
    ctx.fillStyle = "rgb(" + to255(r) + "," + to255(g) + "," + to255(b) + ")";
    ctx.fillRect(x - s / 2 + inset, y - s / 2 + inset, s - inset * 2, s - inset * 2);
  }
  return document.getElementById("c").toDataURL("image/png");
};
</script></body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(html);
  const dataUrl = await page.evaluate(() => window.render());
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  let quality = 80;
  let webp = await sharp(png).webp({ quality, alphaQuality: 90, effort: 6 }).toBuffer();
  while (webp.length > MAX_BYTES && quality > 40) {
    quality -= 10;
    webp = await sharp(png).webp({ quality, alphaQuality: 80, effort: 6 }).toBuffer();
  }
  if (webp.length > MAX_BYTES) throw new Error(`poster is ${webp.length} B, over ${MAX_BYTES}`);
  fs.writeFileSync(out, webp);
  console.log(`wrote ${out} (${webp.length} B, quality ${quality})`);
} finally {
  await browser.close();
}
