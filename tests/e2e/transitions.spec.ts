import { expect, test, type Page } from "@playwright/test";

// Glitch wipe page transitions (spec 18.6): cover 200 ms, route, uncover 200 ms.
// The overlay root carries data-state ("idle" | "covering" | "uncovering").

async function openProjects(page: Page) {
  await page.goto("/projects");
  // The pointer starts at 0,0 over the rail, which expands on hover. Park it in the content.
  await page.mouse.move(640, 400);
  const overlay = page.locator("[data-transition]");
  await expect(overlay).toHaveAttribute("data-state", "idle");
  const link = page.getByTestId("project-grid").getByRole("link").first();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/projects\/[a-z0-9-]+$/);
  // Marks on the layout's persistent nodes: a remount would drop them.
  await page.evaluate(() => {
    document.querySelectorAll('nav[aria-label="Main"]').forEach((el) => {
      (el as HTMLElement & { __kept?: boolean }).__kept = true;
    });
  });
  return { overlay, link, href: href as string };
}

test("card click wipes to the project and ends idle within 1.2 s", async ({ page }) => {
  const { overlay, link, href } = await openProjects(page);
  const start = Date.now();
  await link.click();
  await expect(overlay).not.toHaveAttribute("data-state", "idle");
  expect(await page.locator("[data-glitch-band]").count()).toBe(12);
  await expect(overlay).toHaveAttribute("data-state", "idle", { timeout: 1200 });
  expect(Date.now() - start).toBeLessThan(1200);
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The layout (nav, canvas) stays mounted through the transition.
  const kept = await page.evaluate(() =>
    Array.from(document.querySelectorAll('nav[aria-label="Main"]')).every(
      (el) => (el as HTMLElement & { __kept?: boolean }).__kept === true,
    ),
  );
  expect(kept).toBe(true);
  // Focus moves to the new page instead of staying on the clicked link.
  await expect(page.locator("#main")).toBeFocused();
  // Back never leaves the overlay covering the page.
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(overlay).toHaveAttribute("data-state", "idle");
});

test("rapid double click still ends idle on the right page", async ({ page }) => {
  const { overlay, link, href } = await openProjects(page);
  await link.dblclick();
  await expect(overlay).toHaveAttribute("data-state", "idle", { timeout: 2000 });
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("reduced motion uses the plain fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { overlay, link, href } = await openProjects(page);
  await link.click();
  await expect(overlay).not.toHaveAttribute("data-state", "idle");
  await expect(page.locator("[data-glitch-fade]")).toHaveCount(1);
  await expect(page.locator("[data-glitch-band]")).toHaveCount(0);
  await expect(overlay).toHaveAttribute("data-state", "idle", { timeout: 1200 });
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("modifier and middle clicks open a new tab without the wipe", async ({ page, context, browserName, isMobile }) => {
  test.skip(isMobile || browserName !== "chromium", "New-tab clicks need a desktop pointer.");
  const { overlay, link } = await openProjects(page);
  const clicks: Array<() => Promise<void>> = [
    () => link.click({ modifiers: ["ControlOrMeta"] }),
    () => link.click({ button: "middle" }),
  ];
  for (const click of clicks) {
    const opened = context.waitForEvent("page");
    await click();
    const tab = await opened;
    // A direct read, not an auto-retrying assertion: a started wipe stays non-idle for 200 ms or more.
    expect(await overlay.getAttribute("data-state")).toBe("idle");
    await expect(page).toHaveURL(/\/projects$/);
    await tab.close();
  }
});
