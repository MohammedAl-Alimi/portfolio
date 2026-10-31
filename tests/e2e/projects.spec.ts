import { expect, test } from "@playwright/test";
import { allProjects } from "./helpers/content";
import { expectNoSeriousViolations } from "./helpers/axe";

test("unknown tag shows empty state, not an error", async ({ page }) => {
  const res = await page.goto("/projects?tag=nonexistent");
  expect(res?.status()).toBe(200);
  await expect(page.getByText("No projects with that tag yet.")).toBeVisible();
});

test("tag chip filters and updates url", async ({ page }) => {
  await page.goto("/projects");
  await page
    .getByRole("navigation", { name: "Filter by tag" })
    .getByRole("link", { name: "ai", exact: true })
    .click();
  await expect(page).toHaveURL(/tag=ai/);
  await expect(page.getByRole("link", { name: /crowd detection/i })).toBeVisible();
});

test("projects page renders the heading and passes axe", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expectNoSeriousViolations(page);
});

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/projects");
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflow).toBe(true);
});

test("projects page lists every project", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByTestId("project-grid").getByRole("link")).toHaveCount(allProjects().length);
});
