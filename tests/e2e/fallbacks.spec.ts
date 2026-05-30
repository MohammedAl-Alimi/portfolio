import { expect, test } from "@playwright/test";

test.describe("canvas and fallbacks", () => {
  test("default: one canvas and a high or mid tier", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid)$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("reduced motion: no canvas, low tier, poster visible", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
    await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("h1")).toBeVisible();
    // The poster slot ships with the hero (Task 3). Until then, assert the
    // rule on any poster that exists.
    for (const poster of await page.locator("[data-poster]").all()) {
      await expect(poster).toHaveCSS("opacity", "1");
    }
  });

  test("no webgl: no canvas, low tier, no console errors", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-nowebgl", "No-WebGL project only");
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
