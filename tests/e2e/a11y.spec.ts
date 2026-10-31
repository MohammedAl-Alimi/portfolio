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
