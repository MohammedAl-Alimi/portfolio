import { expect, test, type APIRequestContext } from "@playwright/test";
import { allProjects } from "./helpers/content";
import { BANNED, bannedIn } from "./helpers/colors";
import { sitePaths } from "./helpers/pages";

// The site is monochrome (spec 18.2): the old accent palette and the cream page colour
// must not reach any page outside the Lab, through the markup, the CSS or computed styles.

const pages = sitePaths.filter((p) => !p.startsWith("/lab"));

/** Same-origin stylesheets the HTML links. */
function stylesheets(html: string): string[] {
  const hrefs = new Set<string>();
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/rel="stylesheet"/i.test(tag)) continue;
    const href = tag.match(/href="([^"]+)"/i)?.[1];
    if (href && href.startsWith("/") && !href.startsWith("//")) hrefs.add(href.replace(/&amp;/g, "&"));
  }
  return [...hrefs];
}

async function source(request: APIRequestContext, path: string) {
  const res = await request.get(path);
  const html = await res.text();
  const sheets = stylesheets(html);
  const css = await Promise.all(
    sheets.map(async (href) => {
      const sheet = await request.get(href);
      expect(sheet.ok(), `${href} loads`).toBe(true);
      return sheet.text();
    }),
  );
  return { html, sheets, css: css.join("\n") };
}

test.describe("no colour outside the lab", () => {
  for (const path of pages) {
    test(`${path} html and css carry no accent colour`, async ({ request }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop", "The markup and CSS are the same for every browser");
      const { html, sheets, css } = await source(request, path);
      expect(sheets.length, "the page links its stylesheet").toBeGreaterThan(0);
      expect(bannedIn(html), "in the HTML").toEqual([]);
      expect(bannedIn(css), "in the CSS").toEqual([]);
    });

    test(`${path} computes no accent colour`, async ({ page }, testInfo) => {
      test.skip(
        !["chromium-desktop", "chromium-narrow"].includes(testInfo.project.name),
        "The two chromium layouts cover the rail and the bottom bar",
      );
      await page.goto(path);
      await page.waitForLoadState("load");
      // Every distinct computed colour, on each element and its ::before and ::after.
      const values = await page.evaluate(() => {
        const props = [
          "color",
          "background-color",
          "border-top-color",
          "border-right-color",
          "border-bottom-color",
          "border-left-color",
          "outline-color",
          "fill",
          "stroke",
        ];
        const seen = new Map<string, string>();
        for (const el of Array.from(document.querySelectorAll("*"))) {
          for (const pseudo of [null, "::before", "::after"]) {
            const cs = getComputedStyle(el, pseudo);
            for (const prop of props) {
              const value = cs.getPropertyValue(prop);
              if (!seen.has(value)) seen.set(value, `${el.tagName.toLowerCase()}${pseudo ?? ""} ${prop}`);
            }
          }
        }
        return [...seen].map(([value, where]) => ({ value, where }));
      });
      expect(values.length, "the walk read some colours").toBeGreaterThan(0);
      const hits = values.flatMap(({ value, where }) => bannedIn(value).map((hit) => `${where}: ${value} (${hit})`));
      expect(hits).toEqual([]);
    });
  }

  test("the matcher catches every form of a banned colour", async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Pure logic");
    for (const hex of BANNED) expect(bannedIn(hex.toLowerCase()), hex).toContain(hex);
    expect(bannedIn("rgba(59, 206, 172, 0.5)")).toEqual(["rgb of #3BCEAC"]);
    expect(bannedIn("rgb(255 107 53 / 50%)")).toEqual(["rgb of #FF6B35"]);
    expect(bannedIn("rgb(255, 251, 245)")).toEqual(["rgb of #FFFBF5"]);
    expect(bannedIn("color(srgb 0.231373 0.807843 0.67451 / 0.5)")).toEqual(["srgb of #3BCEAC"]);
    // The site's own greys and near misses stay clear.
    expect(bannedIn("rgb(242, 242, 240) rgba(5, 5, 5, 0.9) #f2f2f0 rgb(255, 107, 530)")).toEqual([]);
  });

  test("a project's frontmatter colour never reaches its page", async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Markup only");
    const crowd = allProjects().find((p) => p.slug === "crowd-detection");
    expect(crowd, "the crowd-detection project exists").toBeDefined();
    const { html } = await source(request, "/projects/crowd-detection");
    expect(html.toLowerCase()).not.toContain("#ff6b35");
  });
});
