import { expect, test, type Page } from "@playwright/test";

// Crosshair cursor (spec 18.6): desktop, fine pointer, high tier, no reduced motion.
// Every other case keeps the native cursor and renders no cursor root.
// On chromium-desktop `?tier=high` (E2E builds only, lib/test-flags.ts) pins the
// high tier, because CI's CPU renderer could otherwise probe it down to mid.

const DESKTOP = "chromium-desktop";
const TARGET = 'a, button, [data-cursor="brackets"]';

const cursor = (page: Page) => page.locator("[data-cursor-root]");

/** Opens `path` on the pinned high tier and waits for the cursor to mount. */
async function openHigh(page: Page, path: string) {
  await page.goto(`${path}?tier=high`);
  await expect(page.locator("html")).toHaveAttribute("data-tier", "high");
  await expect(cursor(page)).toHaveCount(1);
}

async function expectNoCursor(page: Page) {
  await expect(cursor(page)).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-cursor", "custom");
  await expect(page.locator("[data-cursor-readout]")).toBeHidden();
}

test.describe("crosshair cursor", () => {
  test("is absent without a fine pointer, a wide viewport and the high tier", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === DESKTOP, "Covered by the presence test");
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid|low)$/);
    await page.mouse.move(200, 300);
    await expectNoCursor(page);
  });

  test("shows after the first move and follows the pointer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Desktop only");
    await openHigh(page, "/");
    const root = cursor(page);
    await expect(root).toHaveAttribute("aria-hidden", "true");
    // Until a move gives it a position, the native cursor stays.
    await expect(root).toHaveAttribute("data-state", "hidden");
    await expect(page.locator("html")).not.toHaveAttribute("data-cursor", "custom");
    await expect(page.locator("body")).toHaveCSS("cursor", "auto");

    await page.mouse.move(640, 400);
    await expect(root).toHaveAttribute("data-state", "cross");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "custom");
    await expect(page.locator("body")).toHaveCSS("cursor", "none");
    await expect(root).toHaveCSS("transform", "matrix(1, 0, 0, 1, 640, 400)");
    const readout = page.locator("[data-cursor-readout]");
    await expect(readout).toBeVisible();
    await expect(readout).toHaveText("X 0640 Y 0400");

    // The rail stays 72 px wide with the readout in it.
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect.poll(async () => (await nav.boundingBox())?.width ?? 0).toBe(72);

    // Leaving the window hides the crosshair without unmounting it.
    await page.evaluate(() =>
      document.body.dispatchEvent(
        new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse", relatedTarget: null }),
      ),
    );
    await expect(root).toHaveAttribute("data-state", "hidden");
    await page.mouse.move(600, 380);
    await expect(root).toHaveAttribute("data-state", "cross");
  });

  test("touch and pen events are ignored", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Desktop only");
    await openHigh(page, "/");
    const root = cursor(page);
    await page.mouse.move(640, 400);
    await expect(root).toHaveAttribute("data-state", "cross");
    await page.evaluate(() => {
      for (const pointerType of ["touch", "pen"]) {
        document.body.dispatchEvent(
          new PointerEvent("pointerout", { bubbles: true, pointerType, relatedTarget: null }),
        );
        document.body.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType, clientX: 5, clientY: 5 }));
      }
    });
    await expect(page.locator("[data-cursor-readout]")).toHaveText("X 0640 Y 0400");
    await expect(root).toHaveAttribute("data-state", "cross");
  });

  test("switching to reduced motion mid-session removes it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Desktop only");
    await openHigh(page, "/");
    await page.mouse.move(640, 400);
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "custom");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectNoCursor(page);
    await expect(page.locator("body")).toHaveCSS("cursor", "auto");
  });

  test("snaps to brackets over a link and back to the cross off it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Desktop only");
    await openHigh(page, "/");
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
    test.skip(testInfo.project.name !== DESKTOP, "Desktop only");
    await openHigh(page, "/projects");
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

  test("a route change keeps the brackets on a rail link still under the pointer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Desktop only");
    await openHigh(page, "/");
    const root = cursor(page);
    const work = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "WORK", exact: true });
    // Inside the collapsed 72 px: the overlay takes the rail's hover, so it folds while covering.
    const box = await work.boundingBox();
    await page.mouse.move(36, (box?.y ?? 0) + (box?.height ?? 0) / 2);
    await expect(root).toHaveAttribute("data-state", "brackets");
    await page.mouse.down();
    await page.mouse.up();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator("[data-transition]")).toHaveAttribute("data-state", "idle");
    await expect(root).toHaveAttribute("data-state", "brackets");
  });

  test("a route change re-checks what is under the pointer on the new page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DESKTOP, "Desktop only");
    await openHigh(page, "/projects");
    const root = cursor(page);
    const link = page.getByTestId("project-grid").getByRole("link").first();
    const href = (await link.getAttribute("href")) ?? "";
    await link.hover();
    await expect(root).toHaveAttribute("data-state", "brackets");
    const box = await link.boundingBox();
    const at = { x: Math.round((box?.x ?? 0) + (box?.width ?? 0) / 2), y: Math.round((box?.y ?? 0) + (box?.height ?? 0) / 2) };
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator("[data-transition]")).toHaveAttribute("data-state", "idle");
    const expected = await page.evaluate(
      ({ x, y, selector }) => (document.elementFromPoint(x, y)?.closest(selector) ? "brackets" : "cross"),
      { ...at, selector: TARGET },
    );
    await expect(root).toHaveAttribute("data-state", expected);
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
    await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid|low)$/);
    await page.mouse.move(400, 300);
    await expectNoCursor(page);
  });
});
