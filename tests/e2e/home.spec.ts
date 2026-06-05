import { expect, test } from "@playwright/test";
import { featuredProjects } from "./helpers/content";
import { expectNoSeriousViolations } from "./helpers/axe";

test("home renders the name and passes axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Mohammed Al-Alimi",
  );
  await expectNoSeriousViolations(page);
});

test("hero shows name, role and both buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mohammed Al-Alimi");
  await expect(page.getByText("I build AI systems, agents and playful tools")).toBeVisible();
  await expect(page.getByRole("link", { name: "See projects" })).toHaveAttribute("href", "/projects");
  await expect(page.getByRole("link", { name: "Download CV" }).first()).toHaveAttribute("href", "/cv");
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

test("hero name stays in its column on two lines", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
  const slot = await page.locator("[data-hero-slot]").boundingBox();
  expect(h1).not.toBeNull();
  expect(slot).not.toBeNull();
  expect(h1!.x + h1!.width).toBeLessThanOrEqual(slot!.x);
  const lines = page.locator("h1 [data-name-line]");
  await expect(lines).toHaveCount(2);
  const fits = await lines.evaluateAll((els) =>
    els.map((el) => el.scrollWidth <= el.clientWidth && el.getClientRects().length === 1),
  );
  expect(fits).toEqual([true, true]);
});
