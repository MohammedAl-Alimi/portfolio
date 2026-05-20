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
  // The pointer starts at 0,0, over the rail, which expands on hover and covers
  // the chips. Park it in the content first, as a real visitor's pointer would be.
  await page.mouse.move(640, 400);
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

test("cards number themselves in the grid order, even when filtered", async ({ page }) => {
  const projects = allProjects();
  const pad = (n: number) => String(n).padStart(2, "0");
  const position = (slug: string) =>
    projects.toSorted((a, b) => b.year - a.year || a.order - b.order).findIndex((p) => p.slug === slug) + 1;
  const card = (title: string) =>
    page.locator("[data-project-card]").filter({ has: page.getByRole("link", { name: title, exact: true }) });

  // The first card in the unfiltered grid is 01.
  await page.goto("/projects");
  await expect(page.locator("[data-project-card] [data-project-index]").first()).toHaveText(
    `01 / ${pad(projects.length)}`,
  );
  for (const url of ["/projects", "/projects?tag=ai"]) {
    await page.goto(url);
    const crowd = projects.find((p) => p.slug === "crowd-detection")!;
    await expect(card(crowd.title).locator("[data-project-index]")).toHaveText(
      `${pad(position(crowd.slug))} / ${pad(projects.length)}`,
    );
  }
});

test("card covers are greyscale, with the dither on top once drawn", async ({ page }) => {
  await page.goto("/projects");
  const first = page.locator("[data-project-card]").first();
  await expect(first.locator("img")).toHaveCSS("filter", "grayscale(1)");
  await expect(page.locator("html")).toHaveAttribute("data-tier", /high|mid|low/);
  // The low tier (no WebGL) shows the grey image only.
  if ((await page.locator("html").getAttribute("data-tier")) === "low") {
    await expect(first.locator("[data-halftone]")).toHaveCount(0);
  } else {
    await expect(first.locator("[data-halftone]")).toHaveAttribute("data-ready", "");
  }
});
