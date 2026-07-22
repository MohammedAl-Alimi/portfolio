import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "./helpers/axe";

test("lab lists items with plain language and try buttons", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab");
  await expect(
    page.getByText("Small experiments and live demos. Click anything to try it."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it" })).toHaveCount(1);
});

test("lab detail renders a sandboxed iframe and a how it works fold", async ({ page }) => {
  await page.goto("/lab/crowd-dashboard");
  const frame = page.locator("iframe");
  await expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-same-origin");
  await expect(frame).toHaveAttribute("loading", "lazy");
  await expect(page.getByText("How it works")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Lab" })).toBeVisible();
});

test("unknown lab slug returns 404", async ({ page }) => {
  const res = await page.goto("/lab/does-not-exist");
  expect(res?.status()).toBe(404);
});

for (const path of ["/lab", "/lab/crowd-dashboard"]) {
  test(`axe has no serious issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    // The embedded demo is third-party content, so axe skips the iframe.
    await expectNoSeriousViolations(page, { exclude: ["iframe"] });
  });

  test(`no horizontal scroll at 320px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);
  });
}
