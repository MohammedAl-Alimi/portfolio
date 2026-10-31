import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("about has story, timeline and cv button", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("list", { name: "Timeline" }).getByRole("listitem")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Download CV" }).first()).toHaveAttribute("href", "/cv");
});

test("/cv redirects to the pdf", async ({ request }) => {
  const res = await request.get("/cv", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toContain("/cv.pdf");
});

test("about passes axe", async ({ page }) => {
  await page.goto("/about");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("about has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/about");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
