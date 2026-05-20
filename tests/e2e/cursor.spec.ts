import { expect, test, type Page } from "@playwright/test";

// Crosshair cursor (spec 18.6): desktop, fine pointer, high tier, no reduced motion.
// Every other case keeps the native cursor and renders no cursor root.

async function tier(page: Page): Promise<string> {
  await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid|low)$/);
  return (await page.locator("html").getAttribute("data-tier")) ?? "";
}

const cursor = (page: Page) => page.locator("[data-cursor-root]");

async function expectNoCursor(page: Page) {
  await expect(cursor(page)).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-cursor", "custom");
  await expect(page.locator("[data-cursor-readout]")).toBeHidden();
}

test.describe("crosshair cursor", () => {
  test("is present only on desktop with a fine pointer on the high tier", async ({ page }, testInfo) => {
    await page.goto("/");
    const t = await tier(page);
    // A CPU renderer can probe the tier down to mid after load: wait for it to settle.
    if (t === "high") await page.waitForTimeout(2500);
    const settled = await tier(page);
    if (testInfo.project.name !== "chromium-desktop" || settled !== "high") {
      await page.mouse.move(400, 300);
      await expectNoCursor(page);
      return;
    }
    const root = cursor(page);
    await expect(root).toHaveCount(1);
    await expect(root).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "custom");
    await expect(page.locator("body")).toHaveCSS("cursor", "none");

    await page.mouse.move(640, 400);
    await expect(root).toHaveAttribute("data-state", "cross");
    await expect(root).toHaveCSS("transform", "matrix(1, 0, 0, 1, 640, 400)");
    const readout = page.locator("[data-cursor-readout]");
    await expect(readout).toBeVisible();
    await expect(readout).toHaveText("X 0640 Y 0400");

    // The rail stays 72 px wide with the readout in it.
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect.poll(async () => (await nav.boundingBox())?.width ?? 0).toBe(72);

    // Leaving the window hides the crosshair without unmounting it.
    await page.evaluate(() =>
      document.body.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: null })),
    );
    await expect(root).toHaveAttribute("data-state", "hidden");
    await page.mouse.move(600, 380);
    await expect(root).toHaveAttribute("data-state", "cross");
  });

  test("switching to reduced motion mid-session removes it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    await page.waitForTimeout(2500);
    test.skip((await tier(page)) !== "high", "Needs the high tier");
    await expect(cursor(page)).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectNoCursor(page);
    await expect(page.locator("body")).toHaveCSS("cursor", "auto");
  });

  test("snaps to brackets over a link and back to the cross off it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    await page.waitForTimeout(2500);
    test.skip((await tier(page)) !== "high", "Needs the high tier");
    const root = cursor(page);
    await page.mouse.move(640, 400);
    await expect(root).toHaveAttribute("data-state", "cross");

    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "WORK", exact: true }).hover();
    await expect(root).toHaveAttribute("data-state", "brackets");
    await expect(root.locator("[data-cursor-corner]")).toHaveCount(4);
    await expect(root.locator("[data-cursor-corner]").first()).toHaveCSS("opacity", "1");

    await page.mouse.move(640, 400);
    await expect(root).toHaveAttribute("data-state", "cross");
  });

  test("brackets stay on their target while the page scrolls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/projects");
    await page.waitForTimeout(2500);
    test.skip((await tier(page)) !== "high", "Needs the high tier");
    const root = cursor(page);
    const link = page.getByTestId("project-grid").getByRole("link").first();
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect(root).toHaveAttribute("data-state", "brackets");

    await page.evaluate(() => window.scrollBy(0, 30));
    const centre = async () => {
      const box = await link.boundingBox();
      return box ? [Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2)] : null;
    };
    const rootAt = () =>
      root.evaluate((el) => {
        const m = new DOMMatrix(getComputedStyle(el).transform);
        return [Math.round(m.m41), Math.round(m.m42)];
      });
    await expect.poll(async () => JSON.stringify(await rootAt())).toBe(JSON.stringify(await centre()));
  });

  test("a route change resets the brackets to the cross", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    await page.waitForTimeout(2500);
    test.skip((await tier(page)) !== "high", "Needs the high tier");
    const root = cursor(page);
    const work = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "WORK", exact: true });
    await work.hover();
    await expect(root).toHaveAttribute("data-state", "brackets");
    await work.click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(root).toHaveAttribute("data-state", "cross");
  });

  test("no horizontal overflow at 320 px", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-narrow", "Narrow only");
    await page.goto("/");
    await page.mouse.move(100, 300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("reduced motion keeps the native cursor", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await tier(page);
    await page.mouse.move(400, 300);
    await expectNoCursor(page);
  });
});
