import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/projects/does-not-exist", "/definitely-not-a-page"]) {
  test(`${path} returns the custom 404 with status 404`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This page wandered off.",
    );
    await expect(page.getByText("The link may be old, or the page moved.")).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Projects" })).toBeVisible();
  });
}

test("404 page passes axe", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")),
  ).toEqual([]);
});

test("404 page has no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/definitely-not-a-page");
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflow).toBe(true);
});
