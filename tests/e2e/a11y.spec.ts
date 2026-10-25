import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const slugs = fs
  .readdirSync(path.join(process.cwd(), "content/projects"))
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""))
  .sort();

const paths = [
  "/",
  "/projects",
  ...slugs.map((s) => `/projects/${s}`),
  "/lab",
  "/lab/crowd-dashboard",
  "/about",
  "/nope",
];

const viewports = [
  { project: "chromium-narrow", width: 320, height: 640 },
  { project: "chromium-desktop", width: 1280, height: 800 },
];

test.describe.configure({ mode: "parallel" });

for (const vp of viewports) {
  for (const scheme of ["light", "dark"] as const) {
    test.describe(`${vp.width}px ${scheme}`, () => {
      for (const p of paths) {
        test(`${p} passes axe and layout checks`, async ({ page }, testInfo) => {
          test.skip(
            testInfo.project.name !== vp.project,
            `Runs only on ${vp.project}; webkit-mobile is slow and these runs cover the layouts`,
          );
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.emulateMedia({ colorScheme: scheme });
          await page.goto(p);

          // The lab demo iframe is third-party content, so axe skips it.
          const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
          expect(
            results.violations.filter((v) =>
              ["serious", "critical"].includes(v.impact ?? ""),
            ),
          ).toEqual([]);

          const noOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          );
          expect(noOverflow).toBe(true);
          await expect(page.locator("h1")).toHaveCount(1);
          await expect(page.locator("main")).toHaveCount(1);
          const missingAlt = await page.evaluate(
            () => document.querySelectorAll("img:not([alt])").length,
          );
          expect(missingAlt).toBe(0);
        });
      }
    });
  }
}

test.describe("keyboard and motion", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
  });

  test("tab order reaches key controls with a visible focus style", async ({ page }) => {
    await page.goto("/");
    const seen: string[] = [];
    const hidden: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        // Cards draw the ring on the wrapper through focus-within, so an
        // ancestor with a visible outline counts as the focus indicator.
        const ringed = (node: Element | null) => {
          if (!node) return false;
          const c = getComputedStyle(node);
          return c.outlineStyle !== "none" || c.boxShadow !== "none";
        };
        const visible = ringed(el) || ringed(el.parentElement) || ringed(el.closest("[class*='focus-within']"));
        return {
          tag: el.tagName.toLowerCase(),
          label: el.getAttribute("aria-label") ?? "",
          text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60),
          visible,
          isBody: el === document.body,
        };
      });
      if (info.isBody) break; // focus left the page, the cycle is complete
      const name = info.label || info.text;
      seen.push(`${info.tag}: ${name}`);
      if (!info.visible) hidden.push(`${info.tag}: ${name}`);
    }
    console.log(`Tab order on /:\n${seen.join("\n")}`);
    expect(seen[0]).toContain("Skip to content");
    const joined = seen.join("\n");
    // The Search button is a disabled placeholder until search ships, so it is
    // correctly skipped by Tab. Assert that, so enabling it later updates this test.
    await expect(page.getByRole("button", { name: "Search" })).toBeDisabled();
    for (const expected of [
      "theme",
      "Home",
      "Projects",
      "Lab",
      "About",
      "Contact",
      "See projects",
      "Download CV",
      "Crowd detection",
    ]) {
      expect(joined.toLowerCase()).toContain(expected.toLowerCase());
    }
    expect(hidden).toEqual([]);
  });

  test("reduced motion removes the card hover transform", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const card = page
      .getByRole("region", { name: "Featured projects" })
      .getByRole("link")
      .first();
    await card.hover();
    await page.waitForTimeout(400);
    const transform = await card.evaluate((el) => {
      const t = getComputedStyle(el).transform;
      const child = el.firstElementChild ? getComputedStyle(el.firstElementChild).transform : "none";
      return [t, child];
    });
    for (const t of transform) {
      expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(t);
    }
  });
});
