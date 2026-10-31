import { expect, test, type Page } from "@playwright/test";

// The storm exposes window.__storm only in builds made with NEXT_PUBLIC_E2E=1
// (playwright.config.ts webServer env), never in production.
type StormProbe = { frames: number; trailCount: number };

async function probe(page: Page): Promise<StormProbe | null> {
  return page.evaluate(() => (window as unknown as { __storm?: StormProbe }).__storm ?? null);
}

async function waitForStorm(page: Page) {
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("[data-hero-slot] [data-poster]")).toHaveCSS("opacity", "0", { timeout: 10000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __storm?: StormProbe }).__storm));
}

// Sweeps the pointer across the middle of the hero slot in 20 steps.
async function sweep(page: Page) {
  const box = await page.locator("[data-hero-slot]").boundingBox();
  expect(box).not.toBeNull();
  const { x, y, width, height } = box!;
  const midY = y + height * 0.45;
  await page.mouse.move(x + 8, midY);
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(x + 8 + ((width - 16) * i) / 20, midY + Math.sin(i / 3) * 20);
    await page.waitForTimeout(16);
  }
}

test.describe("storm interaction", () => {
  test("pointer wind runs the frame loop and hides the hint for the session", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    await waitForStorm(page);
    const hint = page.locator("[data-hero-hint]");
    await expect(hint).toBeVisible();

    const f0 = (await probe(page))!.frames;
    await sweep(page);
    await page.waitForTimeout(300);
    const after = (await probe(page))!;
    expect(after.frames).toBeGreaterThan(f0 + 5);
    expect(after.trailCount).toBeGreaterThan(0);

    await expect(hint).toBeHidden();
    await expect(hint).toHaveCSS("opacity", "0");

    await page.reload();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator("[data-hero-hint]")).toBeHidden();
  });

  test("reduced motion: no canvas, the hint stays, no probe", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
    await expect(page.locator("canvas")).toHaveCount(0);
    await sweep(page);
    await expect(page.locator("[data-hero-hint]")).toBeVisible();
    expect(await probe(page)).toBeNull();
  });

  test("touch: a drag over the storm runs the loop and the page still scrolls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "webkit-mobile", "Touch device only");
    await page.goto("/");
    const slot = page.locator("[data-hero-slot]");
    // A finger drag must never block vertical scrolling.
    await expect(slot).toHaveCSS("touch-action", "pan-y");

    await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid|low)$/);
    const tier = await page.locator("html").getAttribute("data-tier");
    if (tier !== "low") {
      await waitForStorm(page);
      const f0 = (await probe(page))!.frames;
      await sweep(page);
      await page.waitForTimeout(300);
      const after = (await probe(page))!;
      // Idle frames alone could pass the first check; the trail proves the drag landed.
      expect(after.frames).toBeGreaterThan(f0 + 5);
      expect(after.trailCount).toBeGreaterThan(0);
      await expect(page.locator("[data-hero-hint]")).toBeHidden();
    }

    testInfo.annotations.push({ type: "tier", description: tier ?? "none" });

    // Playwright cannot swipe in mobile WebKit (no touch drag, no wheel), so
    // scroll with the keyboard: the drag above must not have locked the page.
    await page.locator("h1").click();
    await page.keyboard.press("PageDown");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
