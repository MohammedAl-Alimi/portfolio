import { expect, test } from "@playwright/test";
import { featuredProjects } from "./helpers/content";
import { expectNoSeriousViolations } from "./helpers/axe";

test("home renders the name and passes axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Mohammed Al-Alimi");
  await expectNoSeriousViolations(page);
});

test("hero shows the name once, the headline and both buttons", async ({ page }) => {
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveAccessibleName("Mohammed Al-Alimi");
  // The name is in the hero once for screen readers: the glyph layer is hidden from them.
  const exposed = await page.locator("section[aria-labelledby=hero-title]").evaluate((section) => {
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    let n = 0;
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (/mohammed al-alimi/i.test(t.textContent ?? "") && !t.parentElement?.closest("[aria-hidden=true]")) n++;
    }
    return n;
  });
  expect(exposed).toBe(1);
  await expect(page.locator("[data-hero-headline]")).toHaveCSS("font-weight", "800");
  await expect(page.locator("[data-hero-headline]")).toHaveCSS("font-family", /Syne/i);
  await expect(page.getByText("I build AI systems, agents and playful tools")).toBeVisible();
  await expect(page.getByRole("link", { name: "VIEW WORK" })).toHaveAttribute("href", "/projects");
  await expect(page.getByRole("link", { name: "DOWNLOAD CV" }).first()).toHaveAttribute("href", "/cv");
  // Both hero buttons carry corner brackets.
  for (const name of ["VIEW WORK", "DOWNLOAD CV"]) {
    const link = page.locator("section[aria-labelledby=hero-title]").getByRole("link", { name });
    await expect(link.locator("xpath=..").locator("[data-bracket]")).toHaveCount(4);
  }
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflow).toBe(true);
});

test("featured strip lists the featured projects", async ({ page }) => {
  const featured = featuredProjects();
  await page.goto("/");
  const region = page.getByRole("region", { name: "Featured projects" });
  await expect(region.getByRole("link")).toHaveCount(featured.length);
  for (const { title } of featured) {
    await expect(region.getByRole("link", { name: title })).toBeVisible();
  }
});

test("hero headline stays in its column", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const headline = page.locator("[data-hero-headline]");
  const box = await headline.boundingBox();
  const slot = await page.locator("[data-hero-slot]").boundingBox();
  expect(box).not.toBeNull();
  expect(slot).not.toBeNull();
  expect(box!.x + box!.width).toBeLessThanOrEqual(slot!.x);
  const fits = await headline.evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(fits).toBe(true);
});

test.describe("hero figure", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
  });

  test("default tier draws the figure and fades the poster", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas:not([data-halftone])")).toHaveCount(1);
    const poster = page.locator("[data-hero-slot] [data-poster]");
    await expect(poster).toHaveCSS("opacity", "0", { timeout: 6000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Mohammed Al-Alimi");
    await expect(page.getByRole("link", { name: "VIEW WORK" })).toBeVisible();
    await expect(page.getByRole("link", { name: "DOWNLOAD CV" }).first()).toBeVisible();
    await expect(page.getByText("MOVE TO DISTURB.")).toBeVisible();
  });

  test("reduced motion keeps the poster and mounts no canvas", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tier", "low");
    const poster = page.locator("[data-hero-slot] [data-poster]");
    await expect(poster).toHaveCSS("opacity", "1");
    await expect(poster.locator("img")).toHaveAttribute("src", /figure\.webp/);
    await expect(page.locator("canvas:not([data-halftone])")).toHaveCount(0);
  });
});
