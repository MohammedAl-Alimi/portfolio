import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "./helpers/axe";

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
  "/contact",
  "/nope",
];

const viewports = [
  { project: "chromium-narrow", width: 320, height: 640 },
  { project: "chromium-desktop", width: 1280, height: 800 },
];

test.describe.configure({ mode: "parallel" });

for (const vp of viewports) {
  test.describe(`${vp.width}px`, () => {
    for (const p of paths) {
      test(`${p} passes axe and layout checks`, async ({ page }, testInfo) => {
        test.skip(
          testInfo.project.name !== vp.project,
          `Runs only on ${vp.project}; webkit-mobile is slow and these runs cover the layouts`,
        );
        await page.goto(p);

        // The lab demo iframe is third-party content, so axe skips it.
        await expectNoSeriousViolations(page, { exclude: ["iframe"] });

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

test.describe("keyboard and motion", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
  });

  test("tab order reaches key controls with a visible focus style", async ({ page }, testInfo) => {
    await page.goto("/");
    type Stop = { tag: string; name: string; inMainNav: boolean };
    const seen: Stop[] = [];
    const hidden: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const ring = (node: Element | null) => {
          if (!node) return false;
          const c = getComputedStyle(node);
          return c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0;
        };
        // Cards draw the ring on a wrapper through focus-within.
        const wrapper = el.closest("[class*='focus-within']");
        const visible =
          ring(el) || getComputedStyle(el).boxShadow !== "none" || ring(wrapper);
        // Hidden decorative copies (aria-hidden) are not part of the accessible name.
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("[aria-hidden='true']").forEach((n) => n.remove());
        return {
          tag: el.tagName.toLowerCase(),
          name: (el.getAttribute("aria-label") || clone.textContent || "").trim(),
          inMainNav: el.closest("nav[aria-label='Main']") !== null,
          visible,
          isBody: el === document.body,
        };
      });
      if (info.isBody) break; // focus left the page, the cycle is complete
      seen.push({ tag: info.tag, name: info.name, inMainNav: info.inMainNav });
      if (!info.visible) hidden.push(`${info.tag}: ${info.name}`);
    }
    await testInfo.attach("tab-order", {
      body: JSON.stringify(seen, null, 2),
      contentType: "application/json",
    });
    expect(seen[0]).toMatchObject({ tag: "a", name: "Skip to content" });
    // The Search button is a disabled placeholder until search ships, so it is
    // correctly skipped by Tab. Assert that, so enabling it later updates this test.
    await expect(page.getByRole("button", { name: "Search" })).toBeDisabled();
    const has = (tag: string, name: string, inMainNav?: boolean) =>
      seen.some(
        (s) =>
          s.tag === tag &&
          s.name === name &&
          (inMainNav === undefined || s.inMainNav === inMainNav),
      );
    for (const label of ["Mohammed Al-Alimi, home", "HOME", "WORK", "LAB", "ABOUT", "CONTACT"]) {
      expect(has("a", label, true), `main nav link ${label}`).toBe(true);
    }
    const order = seen.map((s) => s.name);
    const indexOf = (name: string) => order.indexOf(name);
    const expected = [
      "Skip to content",
      "Mohammed Al-Alimi, home",
      "HOME",
      "WORK",
      "LAB",
      "ABOUT",
      "CONTACT",
      "VIEW WORK",
      "DOWNLOAD CV",
      "Crowd detection",
    ];
    for (let i = 1; i < expected.length; i++) {
      expect(indexOf(expected[i]!), `${expected[i]} after ${expected[i - 1]}`).toBeGreaterThan(
        indexOf(expected[i - 1]!),
      );
    }
    expect(hidden).toEqual([]);
  });

  for (const [mode, expectLift] of [
    ["reduce", false],
    ["no-preference", true],
  ] as const) {
    test(`card hover lift with reducedMotion ${mode}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: mode });
      await page.goto("/");
      const card = page.locator("[data-project-card]").first();
      await card.hover();
      // Tailwind v4 lifts with the individual `translate` property, so read both.
      const transform = () =>
        card.evaluate((el) => {
          const cs = getComputedStyle(el);
          return `${cs.translate}|${cs.transform}`;
        });
      if (expectLift) {
        await expect.poll(transform).not.toBe("none|none");
      } else {
        await expect.poll(transform).toBe("none|none");
      }
    });
  }
});
