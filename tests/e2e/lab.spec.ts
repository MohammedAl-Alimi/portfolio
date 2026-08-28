import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousViolations } from "./helpers/axe";

test("lab lists items with plain language and try buttons", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab");
  await expect(
    page.getByText("Small experiments and live demos. Click anything to try it."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it" })).toHaveCount(2);
  await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText("Point cloud figure");
});

test("lab detail renders a sandboxed iframe and a how it works fold", async ({ page }) => {
  await page.goto("/lab/crowd-dashboard");
  const frame = page.locator("iframe");
  await expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-same-origin");
  await expect(frame).toHaveAttribute("loading", "lazy");
  await expect(page.getByText("How it works")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Lab" })).toBeVisible();
});

test("unknown lab slug returns 404", async ({ page }) => {
  const res = await page.goto("/lab/does-not-exist");
  expect(res?.status()).toBe(404);
});

const CONTROLS = ["Rotation speed", "Point count", "Glitch rate", "Scanline", "Wind gain"];
const UNAVAILABLE = "The live figure is off here: it needs a graphics card and motion enabled. This is a still image instead.";

async function yaw(page: Page): Promise<number | null> {
  return page.evaluate(() => (window as unknown as { __figure?: { yaw: number } }).__figure?.yaw ?? null);
}

// Two rotation reads 300 ms apart. Both must come from a live probe, so a
// vanished figure fails the test instead of looking still or moving.
async function yawPair(page: Page): Promise<[number, number]> {
  const a = await yaw(page);
  await page.waitForTimeout(300);
  const b = await yaw(page);
  expect(a, "window.__figure is present").not.toBeNull();
  expect(b, "window.__figure is present").not.toBeNull();
  return [a!, b!];
}

async function holdsStill(page: Page): Promise<boolean> {
  const [a, b] = await yawPair(page);
  return a === b;
}

async function turns(page: Page): Promise<boolean> {
  const [a, b] = await yawPair(page);
  return a !== b;
}

test.describe("figure sandbox", () => {
  test("renders the slot, five labelled controls and a reset button", async ({ page }) => {
    await page.goto("/lab/figure");
    await expect(page.locator('[data-lab-slot="figure"]')).toBeVisible();
    for (const label of CONTROLS) await expect(page.getByLabel(label)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
  });

  test("caps the count by tier and stops the rotation at speed 0", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    // ?tier=high pins the tier; ?motion=force lets the figure turn on CI's CPU renderer.
    await page.goto("/lab/figure?tier=high&motion=force");
    const count = page.getByLabel("Point count");
    await expect(count).toHaveAttribute("max", "56000");
    await expect(count).toHaveValue("56000");
    await expect.poll(() => yaw(page), { timeout: 10000 }).not.toBeNull();

    const speed = page.getByLabel("Rotation speed");
    await speed.fill("0");
    await expect(speed).toHaveValue("0");
    await expect.poll(() => holdsStill(page)).toBe(true);

    await speed.fill("0.3");
    await expect.poll(() => turns(page)).toBe(true);

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(speed).toHaveValue("0.15");
  });

  test("a new point count swaps the cloud and keeps the canvas", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
    await page.goto("/lab/figure?tier=high");
    const slot = page.locator("[data-figure-sandbox-slot]");
    const canvas = page.locator("canvas:not([data-halftone])");
    await expect(slot).toHaveAttribute("data-point-count", "56000", { timeout: 10000 });
    await expect(canvas).toHaveCount(1);

    await page.getByLabel("Point count").fill("10000");
    // Sampled together: the old cloud's canvas must be there at every sample until the new cloud is on screen.
    const canvasCounts: number[] = [];
    await expect
      .poll(async () => {
        canvasCounts.push(await canvas.count());
        return slot.getAttribute("data-point-count");
      })
      .toBe("10000");
    expect(canvasCounts.every((n) => n === 1)).toBe(true);
    await expect(canvas).toHaveCount(1);
  });

  test("falls back to the poster with disabled controls without WebGL", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-nowebgl", "No-WebGL project only");
    await page.goto("/lab/figure");
    await expect(page.getByText(UNAVAILABLE)).toBeVisible();
    for (const label of CONTROLS) await expect(page.getByLabel(label)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Reset" })).toBeDisabled();
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});

for (const path of ["/lab", "/lab/crowd-dashboard", "/lab/figure"]) {
  test(`axe has no serious issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    // The embedded demo is third-party content, so axe skips the iframe.
    await expectNoSeriousViolations(page, path === "/lab/crowd-dashboard" ? { exclude: ["iframe"] } : {});
  });

  test(`no horizontal scroll at 320px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);
  });
}
