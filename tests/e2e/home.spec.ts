import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home renders the name and passes axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Mohammed Al-Alimi",
  );
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});
