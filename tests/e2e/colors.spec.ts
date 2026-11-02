import { expect, test, type APIRequestContext } from "@playwright/test";
import { allProjects } from "./helpers/content";
import { sitePaths } from "./helpers/pages";

// The site is monochrome (spec 18.2): the old accent palette and the cream page colour
// must not reach any page outside the Lab, through the markup, the CSS or computed styles.

/** The six old accents, the old fourth accent token, the cream background and the first accent. */
const ACCENTS = ["#FFD23F", "#FF8A3D", "#3BCEAC", "#F06595", "#A78BFA", "#5AA9FF", "#5C7CFA"];
const BANNED = [...ACCENTS, "#FFFBF5", "#FF6B35"];

const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** `rgb(255, 210, 63)` and `rgb(255 210 63)`, with or without alpha, in any spacing. */
const rgbPattern = (hex: string) => {
  const [r, g, b] = rgbOf(hex);
  return new RegExp(`rgba?\\(\\s*${r}[\\s,]+${g}[\\s,]+${b}\\b`, "i");
};
/** As getComputedStyle prints it. */
const computed = BANNED.map((hex) => `rgb(${rgbOf(hex).join(", ")})`);

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

function found(text: string): string[] {
  const hits: string[] = [];
  for (const hex of BANNED) if (text.toLowerCase().includes(hex.toLowerCase())) hits.push(hex);
  for (const hex of ACCENTS) if (rgbPattern(hex).test(text)) hits.push(`rgb of ${hex}`);
  return hits;
}

test.describe("no colour outside the lab", () => {
  for (const path of pages) {
    test(`${path} html and css carry no accent colour`, async ({ request }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop", "The markup and CSS are the same for every browser");
      const { html, sheets, css } = await source(request, path);
      expect(sheets.length, "the page links its stylesheet").toBeGreaterThan(0);
      expect(found(html), "in the HTML").toEqual([]);
      expect(found(css), "in the CSS").toEqual([]);
    });

    test(`${path} computes no accent colour`, async ({ page }, testInfo) => {
      test.skip(
        !["chromium-desktop", "chromium-narrow"].includes(testInfo.project.name),
        "The two chromium layouts cover the rail and the bottom bar",
      );
      await page.goto(path);
      await page.waitForLoadState("load");
      const hits = await page.evaluate((banned) => {
        const props = [
          "color",
          "background-color",
          "border-top-color",
          "border-right-color",
          "border-bottom-color",
          "border-left-color",
        ];
        const out: string[] = [];
        for (const el of Array.from(document.querySelectorAll("*"))) {
          const cs = getComputedStyle(el);
          for (const prop of props) {
            const value = cs.getPropertyValue(prop);
            if (banned.includes(value)) out.push(`${el.tagName.toLowerCase()} ${prop}: ${value}`);
          }
        }
        return out;
      }, computed);
      expect(hits).toEqual([]);
    });
  }

  test("a project's frontmatter colour never reaches its page", async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Markup only");
    const crowd = allProjects().find((p) => p.slug === "crowd-detection");
    expect(crowd, "the crowd-detection project exists").toBeDefined();
    const { html } = await source(request, "/projects/crowd-detection");
    expect(html.toLowerCase()).not.toContain("#ff6b35");
  });
});
