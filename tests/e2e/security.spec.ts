import { expect, test } from "@playwright/test";

test("every public page sends the security headers", async ({ request }) => {
  for (const path of ["/", "/projects", "/projects/crowd-detection", "/lab", "/about"]) {
    const res = await request.get(path);
    const h = res.headers();
    expect(h["content-security-policy"], path).toContain("frame-ancestors 'none'");
    expect(h["strict-transport-security"], path).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(h["x-content-type-options"], path).toBe("nosniff");
    expect(h["x-frame-options"], path).toBe("DENY");
    expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"], path).toBe(
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), browsing-topics=(), interest-cohort=(), accelerometer=(self), gyroscope=(self)",
    );
    expect(h["x-powered-by"], path).toBeUndefined();
  }
});

test("static files carry the baseline security headers", async ({ request }) => {
  for (const path of ["/cv.pdf", "/robots.txt"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()["x-content-type-options"], path).toBe("nosniff");
  }
});

test("pages render with the csp active", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /Content Security Policy/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => {
    if (/Content Security Policy/i.test(e.message)) errors.push(e.message);
  });

  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: unknown[] };
    w.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      w.__cspViolations.push({
        violatedDirective: e.violatedDirective,
        blockedURI: e.blockedURI,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
      });
    });
  });

  const violations = () =>
    page.evaluate(() => (window as unknown as { __cspViolations?: unknown[] }).__cspViolations ?? []);

  for (const path of ["/", "/projects/crowd-detection", "/lab/crowd-dashboard", "/about"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await Promise.race([
      page.waitForLoadState("networkidle").catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    expect(await violations(), `csp violations on ${path}`).toEqual([]);
  }

  expect(await violations(), "csp violations after navigation").toEqual([]);
  expect(errors).toEqual([]);
});

test("security.txt is served", async ({ request }) => {
  const res = await request.get("/.well-known/security.txt");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("Contact:");
});

test("the canvas mounts with no csp violation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Desktop only");
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  page.on("pageerror", (e) => violations.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas:not([data-halftone])")).toHaveCount(1);
  expect(violations).toEqual([]);
});
