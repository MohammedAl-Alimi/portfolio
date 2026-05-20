import { expect, test } from "@playwright/test";

test("sitemap lists every project and lab item", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("xml");
  const xml = await res.text();
  expect(xml).toContain("/projects/crowd-detection");
  expect(xml).toContain("/lab/crowd-dashboard");
  expect(xml).toContain("/about");
});

test("robots.txt allows crawling and points at the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("Sitemap:");
});

test("home has person json-ld and og tags", async ({ page }) => {
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(ld ?? "{}")["@type"]).toBe("Person");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});

test("home og image resolves to a png", async ({ page, request }) => {
  await page.goto("/");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toBeTruthy();
  const res = await request.get(new URL(og as string).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
  // A blank image is far smaller than this.
  expect((await res.body()).byteLength).toBeGreaterThan(10 * 1024);
});

test("project page has a canonical link", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  const href = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(href?.endsWith("/projects/crowd-detection")).toBe(true);
});

test("title template is applied once", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveTitle("About | Mohammed Al-Alimi");
});

test("dynamic page title uses the template", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  await expect(page).toHaveTitle("Crowd detection | Mohammed Al-Alimi");
});
