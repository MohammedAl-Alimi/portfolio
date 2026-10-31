import { expect, test, type Page } from "@playwright/test";

// Chunk names are hashed, so the 3D chunk is recognised by its URL or by the
// renderer code it contains.
function trackScripts(page: Page) {
  const urls: string[] = [];
  const bodies: Promise<string>[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "script") urls.push(r.url());
  });
  page.on("response", (res) => {
    if (res.request().resourceType() === "script") bodies.push(res.text().catch(() => ""));
  });
  return {
    urls,
    async has3d() {
      const texts = await Promise.all(bodies);
      return (
        urls.some((u) => /three|fiber|CanvasRoot|ViewTrack/i.test(u)) ||
        texts.some((t) => t.includes("WebGLRenderer"))
      );
    },
  };
}

test.describe("canvas and fallbacks", () => {
  test("default: one canvas and a high or mid tier", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    const scripts = trackScripts(page);
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("data-tier", /^(high|mid)$/);
    // Control: the detector does see the 3D chunk when it is loaded.
    expect(await scripts.has3d()).toBe(true);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("reduced motion: no canvas, low tier, poster visible", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const scripts = trackScripts(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
    await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await scripts.has3d()).toBe(false);
    const poster = page.locator("[data-hero-slot] [data-poster]");
    await expect(poster).toHaveCount(1);
    await expect(poster).toHaveCSS("opacity", "1");
    await expect(poster.locator("img")).toBeVisible();
  });

  test("no webgl: no canvas, low tier, no console errors", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-nowebgl", "No-WebGL project only");
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    const scripts = trackScripts(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await scripts.has3d()).toBe(false);
    await expect(page.locator("[data-hero-slot] [data-poster]")).toHaveCSS("opacity", "1");
    expect(errors).toEqual([]);
  });
});
