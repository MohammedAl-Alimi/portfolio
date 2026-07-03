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
  // Records the pathname at the moment each state change commits, with no auto-waiting.
  await page.evaluate(() => {
    const w = window as Window & { __transitionLog?: { state: string; path: string; t: number }[] };
    w.__transitionLog = [];
    const root = document.querySelector("[data-transition]");
    if (!root) return;
    new MutationObserver(() => {
      w.__transitionLog?.push({
        state: root.getAttribute("data-state") ?? "",
        path: location.pathname,
        t: performance.now(),
      });
    }).observe(root, { attributes: true, attributeFilter: ["data-state"] });
  });
  return { overlay, link, href: href as string };
}

async function transitionLog(page: Page) {
  return page.evaluate(
    () =>
      (window as Window & { __transitionLog?: { state: string; path: string; t: number }[] }).__transitionLog ?? [],
  );
}

/** The pathname when the reveal first started: the new page must already be in place. */
async function pathAtUncover(page: Page) {
  return (await transitionLog(page)).find((entry) => entry.state === "uncovering")?.path;
}

test("card click wipes to the project and ends idle within 1.2 s", async ({ page }) => {
  const { overlay, link, href } = await openProjects(page);
  await link.click();
  await expect(overlay).not.toHaveAttribute("data-state", "idle");
  expect(await page.locator("[data-glitch-band]").count()).toBe(12);
  await expect(overlay).toHaveAttribute("data-state", "idle", { timeout: 2000 });
  // Timed in the page, from the cover starting to idle, so runner round trips do not count.
  const log = await transitionLog(page);
  const covered = log.find((entry) => entry.state === "covering");
  const idle = log.find((entry) => entry.state === "idle");
  expect(covered).toBeDefined();
  expect(idle).toBeDefined();
  expect(idle!.t - covered!.t).toBeLessThan(1200);
  expect(await pathAtUncover(page)).toBe(href);
  // Read directly at idle: an auto-waiting toHaveURL would pass a late arrival.
  expect(new URL(page.url()).pathname).toBe(href);
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
  expect(await pathAtUncover(page)).toBe(href);
  // Read directly at idle: an auto-waiting toHaveURL would pass a late arrival.
  expect(new URL(page.url()).pathname).toBe(href);
});

/**
 * Clicks internal links from inside the page the moment data-state first becomes `state`.
 * The overlay blocks the pointer while it runs, so the clicks are dispatched on the
 * elements directly; they still go through next/link and the provider.
 */
async function clickWhen(page: Page, state: string, hrefs: string[]) {
  await page.evaluate(
    ({ state, hrefs }) => {
      const root = document.querySelector("[data-transition]");
      if (!root) return;
      const observer = new MutationObserver(() => {
        if (root.getAttribute("data-state") !== state) return;
        observer.disconnect();
        for (const href of hrefs) document.querySelector<HTMLAnchorElement>(`a[href="${href}"]`)?.click();
      });
      observer.observe(root, { attributes: true, attributeFilter: ["data-state"] });
    },
    { state, hrefs },
  );
}

test("a click during the cover is ignored", async ({ page }) => {
  const { overlay, link, href } = await openProjects(page);
  await clickWhen(page, "covering", ["/about"]);
  await link.click();
  await expect(overlay).toHaveAttribute("data-state", "idle", { timeout: 2000 });
  // Give an ignored click time to show up if it was not ignored.
  await page.waitForTimeout(700);
  expect(await overlay.getAttribute("data-state")).toBe("idle");
  expect(new URL(page.url()).pathname).toBe(href);
  expect((await transitionLog(page)).some((entry) => entry.path === "/about")).toBe(false);
});

test("clicks during the reveal are queued and the last one wins", async ({ page }) => {
  const { overlay, link, href } = await openProjects(page);
  await clickWhen(page, "uncovering", ["/lab", "/about"]);
  await link.click();
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 3000 }).toBe("/about");
  await expect(overlay).toHaveAttribute("data-state", "idle", { timeout: 2000 });
  expect(new URL(page.url()).pathname).toBe("/about");
  const log = await transitionLog(page);
  const reveals = log.filter((entry) => entry.state === "uncovering").map((entry) => entry.path);
  // The queued navigation ran its own wipe after the first one finished.
  expect(reveals).toEqual([href, "/about"]);
  expect(log.some((entry) => entry.path === "/lab")).toBe(false);
});

test("reduced motion uses the plain fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { overlay, link, href } = await openProjects(page);
  await link.click();
  await expect(overlay).not.toHaveAttribute("data-state", "idle");
  await expect(page.locator("[data-glitch-fade]")).toHaveCount(1);
  await expect(page.locator("[data-glitch-band]")).toHaveCount(0);
  await expect(overlay).toHaveAttribute("data-state", "idle", { timeout: 1200 });
  expect(await pathAtUncover(page)).toBe(href);
  // Read directly at idle: an auto-waiting toHaveURL would pass a late arrival.
  expect(new URL(page.url()).pathname).toBe(href);
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
