import { expect, test, type Page } from "@playwright/test";

// The figure exposes window.__figure only in builds made with NEXT_PUBLIC_E2E=1
// (playwright.config.ts webServer env), never in production.
type FigureProbe = { frames: number; trailCount: number; yaw: number; software: boolean };

const NAME = "MOHAMMED AL-ALIMI";

async function probe(page: Page): Promise<FigureProbe | null> {
  return page.evaluate(() => {
    const p = (window as unknown as { __figure?: FigureProbe }).__figure;
    return p ? { frames: p.frames, trailCount: p.trailCount, yaw: p.yaw, software: p.software } : null;
  });
}

async function waitForFigure(page: Page) {
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("[data-hero-slot] [data-poster]")).toHaveCSS("opacity", "0", { timeout: 6000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __figure?: FigureProbe }).__figure));
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

function decodedName(page: Page) {
  return page.locator("[data-decode]").filter({ hasText: NAME }).first();
}

test.describe("hero figure", () => {
  test("draws, rotates, reacts to the pointer and hides the hint", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    // CI renders WebGL on the CPU, where the figure holds still; the test-only
    // flag lets the rotation run there too.
    await page.goto("/?motion=force");
    await waitForFigure(page);
    const hint = page.locator("[data-hero-hint]");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText("MOVE TO DISTURB.");

    const a = (await probe(page))!;
    await page.waitForTimeout(1000);
    const b = (await probe(page))!;
    expect(b.frames).toBeGreaterThan(a.frames);
    expect(b.yaw).not.toBe(a.yaw);

    await sweep(page);
    await page.waitForTimeout(200);
    expect((await probe(page))!.trailCount).toBeGreaterThan(0);
    await expect(hint).toBeHidden();
  });

  test("holds still on a software renderer without the flag", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    await waitForFigure(page);
    const a = (await probe(page))!;
    test.skip(!a.software, "Only meaningful on a CPU renderer");
    await page.waitForTimeout(800);
    const b = (await probe(page))!;
    expect(b.yaw).toBe(a.yaw);
  });

  test("the name is in the DOM at load and decodes to the final text", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    const name = decodedName(page);
    // The real text is there from the first byte, for screen readers and crawlers.
    await expect(name.locator(".sr-only")).toHaveText(NAME);
    await expect(name.locator("[data-decode-glyphs]")).toHaveAttribute("aria-hidden", "true");
    await expect(name).toHaveAttribute("data-decode", "done", { timeout: 1500 });
    await expect(name.locator("[data-decode-glyphs]")).toHaveText(NAME);
    await expect(name.locator("[data-decode-glyphs]")).toHaveCSS("opacity", "1");
  });

  test("a missing figure keeps the poster and throws nothing", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const missing = page.waitForResponse((r) => r.url().includes("/figure/missing.bin"));
    await page.goto("/?figure=missing");
    expect((await missing).status()).toBe(404);
    await expect(page.locator("canvas")).toHaveCount(1);
    await page.waitForTimeout(1500);
    const poster = page.locator("[data-hero-slot] [data-poster]");
    await expect(poster).toHaveCSS("opacity", "1");
    await expect(poster.locator("img")).toBeVisible();
    expect(await probe(page)).toBeNull();
    expect(errors).toEqual([]);
  });

  test("reduced motion: poster, no canvas, the name is final at once", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
    const poster = page.locator("[data-hero-slot] [data-poster]");
    await expect(poster).toHaveCSS("opacity", "1");
    await expect(poster.locator("img")).toHaveAttribute("src", /figure/);
    await expect(page.locator("canvas")).toHaveCount(0);
    const glyphs = decodedName(page).locator("[data-decode-glyphs]");
    await expect(glyphs).toHaveText(NAME);
    await expect(glyphs).toHaveCSS("opacity", "1");
    await expect(decodedName(page)).toHaveAttribute("data-decode", "done");
    expect(await probe(page)).toBeNull();
  });

  test("touch: a drag over the figure feeds the wind and the page still scrolls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "webkit-mobile", "Touch device only");
    await page.goto("/");
    const slot = page.locator("[data-hero-slot]");
    // A finger drag must never block vertical scrolling.
    await expect(slot).toHaveCSS("touch-action", "pan-y");

    await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid|low)$/);
    const tier = await page.locator("html").getAttribute("data-tier");
    testInfo.annotations.push({ type: "tier", description: tier ?? "none" });
    if (tier !== "low") {
      await waitForFigure(page);
      await sweep(page);
      await page.waitForTimeout(200);
      expect((await probe(page))!.trailCount).toBeGreaterThan(0);
      await expect(page.locator("[data-hero-hint]")).toBeHidden();
    }

    // Playwright cannot swipe in mobile WebKit, so scroll with the keyboard:
    // the drag above must not have locked the page.
    await page.locator("h1").click();
    await page.keyboard.press("PageDown");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
