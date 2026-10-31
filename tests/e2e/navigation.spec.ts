import { expect, test } from "@playwright/test";

test("desktop nav links are visible and labelled", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Links are hidden below md",
  );
  await page.goto("/");
  for (const label of ["Home", "Projects", "Lab", "About", "Contact"]) {
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label }),
    ).toBeVisible();
  }
});

test("mobile menu opens and closes at 320px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-narrow", "Narrow project only");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("mobile menu keyboard behaviour", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-narrow", "Narrow project only");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Menu" });
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Contact" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
});

test("footer has contact actions", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator("#contact").getByRole("link", { name: /say hi/i }),
  ).toHaveAttribute("href", /^mailto:/);
  await expect(
    page.locator("#contact").getByRole("link", { name: "Download CV" }),
  ).toHaveAttribute("href", "/cv");
});
