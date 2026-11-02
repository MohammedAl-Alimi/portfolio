# How to update the visual baselines

Use this guide when a change to the design moves pixels in one of the three screenshots that `tests/e2e/visual.spec.ts` checks: the home hero, the project page top fold or the 320 px bottom bar. You end up with new PNGs in `tests/e2e/__screenshots__/visual.spec.ts/` that pass the required `build-e2e` check.

## Why the baselines come from CI

The check fails when more than 1% of the pixels differ (`playwright.config.ts:9`). CI renders with Chromium on Ubuntu. Text renders slightly differently on macOS, and on the project page that difference is about 2%. So a baseline made on a Mac can fail on CI even when nothing is wrong. The baselines that count are the ones CI's Chromium renders.

| Baseline | Project | Where it comes from |
| --- | --- | --- |
| `hero-chromium-desktop.png` | `chromium-desktop` | A local update works, because it matches CI |
| `bottom-bar-chromium-narrow.png` | `chromium-narrow` | A local update works, because it matches CI |
| `project-chromium-desktop.png` | `chromium-desktop` | Always the CI actual |

## Steps

1. Update the two baselines that match CI on your machine. Playwright builds and starts the site with `NEXT_PUBLIC_E2E=1` (`playwright.config.ts:18` to `playwright.config.ts:25`). If a server is already running on port 3000, it reuses that one, so make sure the running server is an E2E build of your branch.
   ```sh
   npx playwright test tests/e2e/visual.spec.ts --project chromium-desktop -g "home hero" --update-snapshots
   npx playwright test tests/e2e/visual.spec.ts --project chromium-narrow -g "bottom bar" --update-snapshots
   ```
   Open each new PNG and check that it shows what you expect. Do not update the project page locally.
2. Commit and push to your pull request branch. If `build-e2e` passes, you are done.
3. If `build-e2e` fails in `visual.spec.ts`, download the report from that run. The workflow uploads it as `playwright-report` when the job fails (`.github/workflows/ci.yml:76` to `.github/workflows/ci.yml:81`).
   ```sh
   gh run list --branch "$(git branch --show-current)" --workflow CI --limit 1
   gh run download <run-id> -n playwright-report -D /tmp/playwright-report
   npx playwright show-report /tmp/playwright-report
   ```
4. In the report, open each failing screenshot test and select **Actual**. Check that the image is right: the rail is collapsed, the ticker is masked, and only your change moved. Then open the image on its own and copy that file from `/tmp/playwright-report/data/` over the baseline with the same name.
   ```sh
   cp /tmp/playwright-report/data/<file>.png tests/e2e/__screenshots__/visual.spec.ts/project-chromium-desktop.png
   ```
   CI retries a failed test twice. All three attempts show the same actual image when the render is deterministic. If they differ, fix the flake before you commit a baseline.
5. Commit the copied PNGs and push. `build-e2e` should now pass.

## Related

- [Configuration reference](../reference/configuration.md#playwrightconfigts) for the screenshot settings.
- [How to regenerate the figure](regenerate-the-figure.md), which changes the hero poster and so the hero baseline.
