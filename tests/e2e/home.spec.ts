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

test("featured strip lists the four featured projects", async ({ page }) => {
  await page.goto("/");
  const region = page.getByRole("region", { name: "Featured projects" });
  await expect(region.getByRole("link")).toHaveCount(4);
  for (const title of [
    "Crowd detection",
    "Noah hub",
    "Agent security playbook",
    "Is my app safe",
  ]) {
    await expect(region.getByRole("link", { name: title })).toBeVisible();
  }
});
