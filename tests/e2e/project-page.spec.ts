import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("project page renders hero, sections and only the links present", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Crowd detection");
  await expect(page.getByRole("link", { name: "Repo" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Demo" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Live" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Problem" })).toBeVisible();
});

test("project page has an og image", async ({ request }) => {
  const res = await request.get("/projects/crowd-detection/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("unknown project returns 404", async ({ page }) => {
  const res = await page.goto("/projects/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("project page passes axe", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")),
  ).toEqual([]);
});

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/projects/crowd-detection");
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflow).toBe(true);
});
