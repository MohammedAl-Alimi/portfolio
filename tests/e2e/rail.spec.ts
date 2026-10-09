import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "./helpers/axe";

const LABELS = ["HOME", "WORK", "LAB", "ABOUT", "CONTACT"];
const MOBILE = ["webkit-mobile", "chromium-narrow"];

test.describe("desktop rail", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
  });

  test("has the five tabs and one Main navigation", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toHaveCount(1);
    await expect(nav).toBeVisible();
    for (const label of LABELS) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(1);
    }
    await expect(nav.getByRole("button", { name: "Search" })).toBeDisabled();
    await expect(nav.getByRole("link", { name: "Mohammed Al-Alimi, home" })).toHaveAttribute("href", "/");
  });

  for (const [path, label] of [
    ["/", "HOME"],
    ["/projects", "WORK"],
    ["/about", "ABOUT"],
    ["/contact", "CONTACT"],
  ] as const) {
    test(`aria-current follows the route ${path}`, async ({ page }) => {
      await page.goto(path);
      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(nav.locator("[aria-current='page']")).toHaveCount(1);
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });
  }

  test("collapsed rail keeps every tab icon visible", async ({ page }) => {
    await page.goto("/");
    await page.mouse.move(700, 400);
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect.poll(async () => (await nav.boundingBox())?.width ?? 0).toBe(72);
    for (const label of LABELS) {
      const svg = nav.getByRole("link", { name: label, exact: true }).locator("svg");
      expect((await svg.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(15);
    }
  });

  test("hovering the rail reveals the labels", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    const label = nav.locator("[data-rail-label]").first();
    await page.mouse.move(700, 400);
    await expect.poll(async () => (await nav.boundingBox())?.width ?? 0).toBe(72);
    await expect(label).toHaveCSS("opacity", "0");
    await nav.hover();
    await expect(label).toHaveCSS("opacity", "1");
    await expect.poll(async () => (await label.boundingBox())?.width ?? 0).toBeGreaterThan(0);
    await expect.poll(async () => (await nav.boundingBox())?.width ?? 0).toBe(220);
  });

  test("the scroll readout follows the page", async ({ page }) => {
    await page.goto("/");
    const readout = page.locator("[data-scroll-readout]");
    await expect(readout).toHaveText("00.00");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(readout).toHaveText("99.99");
  });

  test("Tab from the skip link reaches the tabs in order", async ({ page }) => {
    await page.goto("/");
    const names: string[] = [];
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press("Tab");
      names.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("[aria-hidden='true']").forEach((n) => n.remove());
          return (el.getAttribute("aria-label") || clone.textContent || "").trim();
        }),
      );
    }
    expect(names).toEqual([
      "Skip to content",
      "Mohammed Al-Alimi, home",
      ...LABELS,
    ]);
  });
});

test.describe("mobile tab bar", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!MOBILE.includes(testInfo.project.name), "Mobile only");
  });

  test("shows five tabs and no rail", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toHaveCount(1);
    await expect(nav).toBeVisible();
    for (const label of LABELS) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    const box = await nav.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height).toBe(56);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBe(viewport?.height);
  });

  test("the last section ends above the bar", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const bottom = await page.evaluate(() => {
      const last = document.querySelector("footer") as HTMLElement;
      return last.getBoundingClientRect().bottom;
    });
    const height = page.viewportSize()?.height ?? 0;
    expect(bottom).toBeLessThanOrEqual(height - 56 + 0.5);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("aria-current marks the active tab", async ({ page }) => {
    await page.goto("/lab");
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "LAB", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("contact page", () => {
  test("has the four rows and passes axe", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("CONTACT");
    await expect(page.locator("[data-contact-row]")).toHaveCount(4);
    await expect(page.getByRole("link", { name: "EMAIL ME" })).toHaveAttribute("href", /^mailto:/);
    await expect(page.getByRole("link", { name: "DOWNLOAD CV" })).toHaveAttribute("href", "/cv");
    await expect(page.getByRole("link", { name: "GITHUB", exact: true }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "LINKEDIN", exact: true }).last()).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});
