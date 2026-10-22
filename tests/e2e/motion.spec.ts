import { expect, test, type Page } from "@playwright/test";

// Scroll-driven motion on Home (spec 18.6): figure orbit, grid floor, ticker,
// decoded headings, count up. window.__figure exists only in NEXT_PUBLIC_E2E=1 builds.
type Probe = { orbit: number };

function orbit(page: Page): Promise<number | null> {
  return page.evaluate(() => (window as unknown as { __figure?: Probe }).__figure?.orbit ?? null);
}

function gridPosition(page: Page): Promise<string> {
  return page.locator("[data-grid-plane]").evaluate((el) => getComputedStyle(el).backgroundPosition);
}

function tickerTransform(page: Page): Promise<string> {
  return page.locator("[data-ticker-track]").first().evaluate((el) => getComputedStyle(el).transform);
}

// Native scroll: Lenis follows it, and it works the same on touch WebKit.
async function scrollTo(page: Page, y: number) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
}

async function tier(page: Page): Promise<string> {
  await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid|low)$/);
  return (await page.locator("html").getAttribute("data-tier")) ?? "";
}

test.describe("scroll motion", () => {
  test("scrolling 600 px orbits the figure and moves the grid floor; the ticker runs", async ({ page }) => {
    await page.goto("/");
    const t = await tier(page);
    if (t !== "low") {
      await expect(page.locator("canvas")).toHaveCount(1);
      await page.waitForFunction(() => Boolean((window as unknown as { __figure?: Probe }).__figure));
      expect(await orbit(page)).toBe(0);
      // Smooth scrolling runs on capable tiers only.
      await expect(page.locator("html")).toHaveClass(/\blenis\b/);
    }

    const ticker0 = await tickerTransform(page);
    await page.waitForTimeout(400);
    expect(await tickerTransform(page)).not.toBe(ticker0);

    const grid0 = await gridPosition(page);
    await scrollTo(page, 600);
    await expect.poll(() => gridPosition(page)).not.toBe(grid0);
    await expect(page.locator("[data-scroll-readout]")).not.toHaveText("00.00");
    if (t !== "low") {
      await expect.poll(() => orbit(page)).toBeGreaterThan(0);
      expect(await orbit(page)).toBeLessThanOrEqual(0.52);
    }
  });

  test("the orbit reaches 0.52 rad once the hero has scrolled out, and returns to 0", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    test.skip((await tier(page)) === "low", "No canvas on the low tier");
    await page.waitForFunction(() => Boolean((window as unknown as { __figure?: Probe }).__figure));
    const end = await page.locator("[data-hero]").evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    await scrollTo(page, end + 200);
    await expect.poll(() => orbit(page)).toBeCloseTo(0.52, 2);
    await scrollTo(page, 0);
    await expect.poll(() => orbit(page)).toBe(0);
  });

  test("keyboard scrolling still works with smooth scroll on", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    await tier(page);
    await page.locator("h1").click();
    await page.keyboard.press("End");
    await expect(page.locator("[data-scroll-readout]")).toHaveText("99.99");
  });

  test("reduced motion: no orbit, a still grid floor and a still ticker", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await tier(page)).toBe("low");
    await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(await orbit(page)).toBeNull();

    expect(await tickerTransform(page)).toBe("none");
    await page.waitForTimeout(400);
    expect(await tickerTransform(page)).toBe("none");

    const grid0 = await gridPosition(page);
    await scrollTo(page, 600);
    await expect(page.locator("[data-scroll-readout]")).not.toHaveText("00.00");
    await page.waitForTimeout(300);
    expect(await gridPosition(page)).toBe(grid0);
  });
});

test.describe("headings and numbers", () => {
  test("section headings decode once they scroll into view", async ({ page }) => {
    await page.goto("/");
    await tier(page);
    const heading = page.getByRole("heading", { level: 2, name: "What I build" });
    await expect(heading).toHaveAttribute("data-decode", /^(wait|fade)$/);
    await heading.scrollIntoViewIfNeeded();
    // A GPU decodes ("done"); the low tier and CPU renderers (CI) fade instead.
    await expect(heading).toHaveAttribute("data-decode", /^(done|fade)$/);
    await expect(heading.locator("[data-decode-glyphs]")).toHaveText("What I build");
    await expect(heading.locator("[data-decode-glyphs]")).toHaveCSS("opacity", "1");
  });

  test("reduced motion: headings fade, years do not count", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 2, name: "What I build" });
    await expect(heading).toHaveAttribute("data-decode", "fade");
    const year = page.locator("[data-project-card] [data-count-up]").first();
    await year.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await expect(year).not.toHaveAttribute("data-count-up", /run|done/);
    await expect(year).toHaveText(/^\d{4}$/);
  });

  test("a project year counts up to its value on entering view", async ({ page }) => {
    await page.goto("/");
    const year = page.locator("[data-project-card] [data-count-up]").first();
    const value = await year.textContent();
    await year.scrollIntoViewIfNeeded();
    await expect(year).toHaveAttribute("data-count-up", "done");
    await expect(year).toHaveText(value ?? "");
  });
});
