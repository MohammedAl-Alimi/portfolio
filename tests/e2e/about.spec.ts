import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "./helpers/axe";

test("about has story, timeline and cv button", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("list", { name: "Timeline" }).getByRole("listitem")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Download CV" }).first()).toHaveAttribute("href", "/cv");
});

test("the about title decodes at load and keeps its exact text", async ({ page }) => {
  await page.goto("/about");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveAccessibleName("About me");
  await expect(h1.locator("[data-decode-glyphs]")).toHaveText("About me");
  await expect(h1).toHaveAttribute("data-decode", /^(done|fade)$/);
});

test("timeline titles decode once they scroll into view", async ({ page }) => {
  await page.goto("/about");
  const titles = page.locator("[data-about-timeline] li [data-decode]");
  await expect(titles).toHaveCount(4);
  for (const title of await titles.all()) {
    await title.scrollIntoViewIfNeeded();
    // A GPU decodes; a CPU renderer or the low tier fades the final text in instead.
    await expect(title).toHaveAttribute("data-decode", /^(done|fade)$/);
  }
});

test("/cv redirects to the pdf", async ({ request }) => {
  const res = await request.get("/cv", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toContain("/cv.pdf");
});

test("about passes axe", async ({ page }) => {
  await page.goto("/about");
  await expectNoSeriousViolations(page);
});

test("about has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/about");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
