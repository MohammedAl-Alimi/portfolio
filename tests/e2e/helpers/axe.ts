import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function expectNoSeriousViolations(
  page: Page,
  options: { exclude?: string[] } = {},
): Promise<void> {
  // Decoded text fades in. Mid-fade it is see-through, which axe reads as low
  // contrast, so wait until every decode layer has settled at full opacity.
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("[data-decode-glyphs]")).every(
      (el) => el.getAnimations().every((a) => a.playState !== "running") && getComputedStyle(el).opacity === "1",
    ),
  );
  let builder = new AxeBuilder({ page });
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  const results = await builder.analyze();
  expect(
    results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")),
  ).toEqual([]);
}
