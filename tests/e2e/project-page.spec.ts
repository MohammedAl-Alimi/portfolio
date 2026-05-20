import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "./helpers/axe";

test("project page renders hero, sections and only the links present", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Crowd detection");
  await expect(page.getByRole("link", { name: "Repo" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Demo" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Live" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Problem" })).toBeVisible();
});

test("the title is the exact text at load, then decodes or fades", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  const title = page.locator("h1#project-title");
  // No waiting: the final text is the layout box from the first paint.
  expect(await title.locator("[data-decode-glyphs]").textContent()).toBe("Crowd detection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Crowd detection");
  await expect(title).toHaveAttribute("data-decode", /^(done|fade)$/, { timeout: 3000 });
  await expect(title.locator("[data-decode-glyphs]")).toHaveText("Crowd detection");
});

test("the hero is black and carries no project colour", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  const hero = page.locator("section[aria-labelledby='project-title']");
  await expect(hero).toHaveCSS("background-color", "rgb(5, 5, 5)");
  // crowd-detection's frontmatter colour is #FF6B35.
  const projectColour = "rgb(255, 107, 53)";
  const painted = await hero.evaluate((root, colour) => {
    const all = [root, ...Array.from(root.querySelectorAll("*"))];
    return all
      .filter((el) => {
        const s = getComputedStyle(el);
        return [s.backgroundColor, s.color, s.borderTopColor].some((c) => c === colour);
      })
      .map((el) => el.tagName);
  }, projectColour);
  expect(painted).toEqual([]);
});

test("project page has an og image", async ({ page, request }) => {
  await page.goto("/projects/crowd-detection");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toBeTruthy();
  const res = await request.get(new URL(og as string).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("unknown project returns 404", async ({ page }) => {
  const res = await page.goto("/projects/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("project page passes axe", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  await expectNoSeriousViolations(page);
});

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/projects/crowd-detection");
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflow).toBe(true);
});
