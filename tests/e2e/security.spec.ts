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
    expect(h["permissions-policy"], path).toContain("camera=()");
    expect(h["x-powered-by"], path).toBeUndefined();
  }
});

test("pages render with the csp active and the theme still toggles", async ({ page }) => {
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

  await page.goto("/");
  const html = page.locator("html");
  const before = (await html.getAttribute("class"))?.includes("dark") ?? false;
  await page.getByRole("button", { name: /theme|dark|light/i }).first().click();
  await expect
    .poll(async () => ((await html.getAttribute("class")) ?? "").includes("dark"))
    .toBe(!before);

  expect(await violations(), "csp violations after theme toggle").toEqual([]);
  expect(errors).toEqual([]);
});

test("security.txt is served", async ({ request }) => {
  const res = await request.get("/.well-known/security.txt");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("Contact:");
});
