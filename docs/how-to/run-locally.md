# How to run the site locally

Use this when you want the site, its tests and its quality checks running on your machine.

## Steps

1. Clone the repository and enter it.
   ```bash
   git clone https://github.com/MohammedAl-Alimi/portfolio.git
   cd portfolio
   ```
2. Use Node 24. The version is pinned in `.nvmrc:1`.
   ```bash
   nvm use
   ```
   If `nvm` says Node 24 is not installed, run `nvm install` first, then `nvm use`. CI uses the same file (`.github/workflows/ci.yml:22`).
3. Install the exact locked dependencies.
   ```bash
   npm ci
   ```
4. Copy the example environment file.
   ```bash
   cp .env.example .env.local
   ```
   Every variable is optional today. See the table below.
5. Start the dev server.
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

## Environment variables

| Variable | What it is for | Needed now |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for the sitemap, robots and metadata (`.env.example:7`). Falls back to the production alias (`lib/site.ts:1`, `lib/site.ts:4`). | No |
| `GITHUB_TOKEN` | Server-only token for the upcoming live GitHub data (`.env.example:2`). Nothing reads it yet. | No |
| `LEETCODE_USERNAME` | Server-only name for the upcoming LeetCode data (`.env.example:3`). Nothing reads it yet. | No |

Never give a secret a `NEXT_PUBLIC_` prefix. See [Configuration](../reference/configuration.md) for details.

## Run the checks

1. Lint and types.
   ```bash
   npm run lint
   npm run typecheck
   ```
2. Validate the content files (`package.json:13`).
   ```bash
   npm run validate:content
   ```
   You should see a line like `projects: 7, lab: 1, highlights: 0`.
3. Run the unit tests (`package.json:14`).
   ```bash
   npm run test
   ```
4. Scan for secrets and personal strings (`package.json:12`).
   ```bash
   npm run check:secrets
   ```
   You should see `check-secrets: clean`.
5. Run the end to end tests (`package.json:16`).
   ```bash
   npx playwright install --with-deps chromium webkit
   npm run test:e2e
   ```
   The browser install is needed only the first time. If you skip it, Playwright cannot launch Chromium or WebKit.
   The config starts `npm run build && npm run start` for you (`playwright.config.ts:16`). If something already listens on port 3000, Playwright reuses it when not in CI (`playwright.config.ts:18`). A stale server from an earlier run then serves old code. Stop it before the run.
6. Run Lighthouse (`package.json:17`). Build first, because it starts `npm run start` (`lighthouserc.json:4`).
   ```bash
   npm run build
   npm run lhci
   ```

## Verify it worked

- `npm run dev` prints a local URL and the home page loads.
- `npm run test` ends with all test files passing.
- `npm run build` runs `validate:content` first through the `prebuild` hook (`package.json:7`), so a broken content file stops the build.

## Where this lives in the code

- `package.json:6` to `package.json:17`: every script.
- `playwright.config.ts:15`: the web server the e2e tests start.
- `lighthouserc.json:15` to `lighthouserc.json:18`: the score thresholds Lighthouse enforces.

## Related

- [Project structure](../reference/project-structure.md)
- [Configuration](../reference/configuration.md)
