import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Visual baselines for the Monolith (spec 18). Reduced motion makes them deterministic:
// the low tier shows the poster instead of the live figure, and nothing decodes or glitches.
// Regenerate with `npx playwright test tests/e2e/visual.spec.ts --update-snapshots`
// and commit the PNGs in tests/e2e/__screenshots__/.

// The grain is a full-screen layer, so a mask would hide the whole shot: it is hidden instead.
const HIDE_GRAIN = path.join(__dirname, "helpers/hide-grain.css");

async function open(page: Page, path: string, width: number, height: number) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width, height });
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
  await page.evaluate(() => document.fonts.ready);
}

/** Waits until every image that intersects the viewport has decoded. */
async function imagesInView(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => {
            const r = img.getBoundingClientRect();
            return r.bottom > 0 && r.top < innerHeight && r.width > 0;
          })
          .every((img) => img.complete && img.naturalWidth > 0),
      ),
    )
    .toBe(true);
}

test.describe("visual baselines", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      ["webkit-mobile", "chromium-nowebgl"].includes(testInfo.project.name),
      "Baselines live on the two chromium layouts",
    );
  });

  test("home hero", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "1280 px layout");
    await open(page, "/", 1280, 800);
    await expect(page.locator("[data-hero-slot] [data-poster] img")).toBeVisible();
    await imagesInView(page);
    await expect(page).toHaveScreenshot("hero.png", { mask: [page.locator("[data-ticker]")], stylePath: HIDE_GRAIN });
  });

  test("project page top fold", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "1280 px layout");
    await open(page, "/projects/crowd-detection", 1280, 800);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await imagesInView(page);
    await expect(page).toHaveScreenshot("project.png", { mask: [page.locator("[data-ticker]")], stylePath: HIDE_GRAIN });
  });

  test("bottom bar at 320 px", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-narrow", "320 px layout");
    await open(page, "/", 320, 800);
    const bar = page.getByRole("navigation", { name: "Main" }).locator("visible=true");
    await expect(bar).toHaveCount(1);
    await expect(bar).toHaveScreenshot("bottom-bar.png", { stylePath: HIDE_GRAIN });
  });
});
