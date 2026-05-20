import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "./helpers/axe";

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
  await expectNoSeriousViolations(page);
});

test("404 page has no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/definitely-not-a-page");
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflow).toBe(true);
});

test("404 figure starts as static and reassembles on click", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  const field = page.locator("[data-static-field]");
  await expect(field).toHaveAttribute("data-state", "scattered");
  const button = page.getByRole("button", { name: "Reassemble the figure" });
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  // Polls until the points have landed (900 ms with a canvas, at once without one).
  await expect(field).toHaveAttribute("data-state", "whole", { timeout: 3000 });
  await button.click();
  await expect(field).toHaveAttribute("data-state", "scattered");
});

test("404 figure reassembles from the keyboard", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  const button = page.getByRole("button", { name: "Reassemble the figure" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-static-field]")).toHaveAttribute("data-state", "whole", { timeout: 3000 });
});
