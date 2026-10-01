// Usage: node scripts/screenshot.mjs <url> <out.webp> [width] [height] [waitMs]
// Takes a screenshot with Playwright's Chromium and saves it as WebP via sharp.
import { chromium } from "@playwright/test";
import sharp from "sharp";

const [url, out, width = "1600", height = "900", waitMs = "3000"] = process.argv.slice(2);
if (!url || !out) {
  console.error("Usage: node scripts/screenshot.mjs <url> <out.webp> [width] [height] [waitMs]");
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(Number(waitMs));
  const png = await page.screenshot({ type: "png" });
  await sharp(png).webp({ quality: 80 }).toFile(out);
} finally {
  await browser.close();
}
