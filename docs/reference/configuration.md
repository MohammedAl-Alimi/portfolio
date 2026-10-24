# Configuration reference

Complete reference for environment variables, tool configuration, security headers, secret scanning, dependency updates and branch protection.

## Environment variables

Template: `.env.example`. Copy it to `.env.local` for local work. `.env` and `.env.*` are git-ignored except `.env.example` (`.gitignore:17` to `.gitignore:19`).

| Name | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | absolute URL | `https://portfolio-mohammed-al-alimis-projects.vercel.app` | no | Canonical origin for sitemap, robots and metadata. Trailing slashes are removed. An invalid value throws at startup. Read in `lib/site.ts:4`, declared in `.env.example:7`. |
| `GITHUB_TOKEN` | secret string | none | no | Server-only. Reserved for the upcoming live GitHub data. Nothing in `app/`, `lib/` or `components/` reads it today. Declared in `.env.example:2`. |
| `LEETCODE_USERNAME` | string | none | no | Server-only. Reserved for the upcoming LeetCode data. Nothing reads it today. Declared in `.env.example:3`. |

`NODE_ENV` is read in `proxy.ts:12` to enable `'unsafe-eval'` in development only.

## next.config.ts

| Option | Value | Effect | Location |
| --- | --- | --- | --- |
| `poweredByHeader` | `false` | Removes the `X-Powered-By` response header. The e2e test asserts it is absent (`tests/e2e/security.spec.ts:15`). | `next.config.ts:4` |
| `htmlLimitedBots` | `/.*/` | Resolves metadata before the HTML shell is sent, so `<title>` and description are in `<head>` for every visitor. The comment in the file names Lighthouse and some crawlers as the reason. | `next.config.ts:8` |

## vercel.json

| Key | Value | Location |
| --- | --- | --- |
| `framework` | `nextjs` | `vercel.json:2` |
| `github.silent` | `true`, which puts the Vercel GitHub integration in silent mode | `vercel.json:3` |

## lighthouserc.json

| Setting | Value | Location |
| --- | --- | --- |
| Server command | `npm run start` | `lighthouserc.json:3` |
| Ready pattern | `Ready\|started server` | `lighthouserc.json:4` |
| URLs | `/`, `/projects/crowd-detection`, `/lab` on `localhost:3000` | `lighthouserc.json:6` to `lighthouserc.json:10` |
| Runs per URL | 3 | `lighthouserc.json:11` |
| Upload target | `temporary-public-storage` | `lighthouserc.json:21` |

Budgets (each level is `error`, so a miss fails the job):

| Category | Minimum score | Location |
| --- | --- | --- |
| Performance | 0.85 | `lighthouserc.json:15` |
| Accessibility | 0.95 | `lighthouserc.json:16` |
| Best practices | 0.95 | `lighthouserc.json:17` |
| SEO | 0.95 | `lighthouserc.json:18` |

## playwright.config.ts

| Setting | Value | Location |
| --- | --- | --- |
| Test directory | `tests/e2e` | `playwright.config.ts:6` |
| Parallel | `fullyParallel: true` | `playwright.config.ts:7` |
| CI mode | `CI` env var set: `forbidOnly`, 2 retries, `github` and `html` reporters | `playwright.config.ts:3`, `playwright.config.ts:8` to `playwright.config.ts:10` |
| Base URL | `http://localhost:3000` | `playwright.config.ts:12` |
| Web server | `npm run build && npm run start`, timeout 180000 ms | `playwright.config.ts:16`, `playwright.config.ts:19` |
| Reuse server | `!isCI`: reuses a running server outside CI | `playwright.config.ts:18` |

Projects:

| Name | Device | Viewport | Location |
| --- | --- | --- | --- |
| `chromium-desktop` | Desktop Chrome | 1280 by 800 | `playwright.config.ts:23` to `playwright.config.ts:24` |
| `webkit-mobile` | iPhone 13 | device default | `playwright.config.ts:26` |
| `chromium-narrow` | Desktop Chrome | 320 by 640 | `playwright.config.ts:28` to `playwright.config.ts:29` |

## vitest.config.ts

| Setting | Value | Location |
| --- | --- | --- |
| Plugin | `@vitejs/plugin-react` | `vitest.config.ts:6` |
| Alias `@` | Repository root | `vitest.config.ts:9` |
| Alias `server-only` | `tests/unit/mocks/server-only.ts`, so server modules import in tests | `vitest.config.ts:10` |
| Environment | `jsdom` | `vitest.config.ts:14` |
| Globals | `false` (tests import `describe`, `it`, `expect`) | `vitest.config.ts:15` |
| Include | `tests/unit/**/*.test.{ts,tsx}` | `vitest.config.ts:16` |
| Setup file | `tests/unit/setup.ts` | `vitest.config.ts:18` |

## proxy.ts

`proxy` runs for matching requests and sets the nonce, the CSP and the security headers (`proxy.ts:4`).

| Behaviour | Detail | Location |
| --- | --- | --- |
| Nonce | `Buffer.from(crypto.randomUUID()).toString("base64")`, new per request | `proxy.ts:5` |
| Request headers | Sets `x-nonce` and `Content-Security-Policy` so Next and the layout can read them | `proxy.ts:17`, `proxy.ts:19` |
| Plain localhost | On `http://localhost` or `http://127.0.0.1` the `upgrade-insecure-requests` directive is left out | `proxy.ts:8` to `proxy.ts:14` |
| Matcher | Every path except `_next/static`, `_next/image`, `favicon.ico`, and files ending in `webp`, `png`, `jpg`, `jpeg`, `svg`, `ico`, `pdf`, `txt`, `xml`, `js`, `css`, `map`, `woff`, `woff2` | `proxy.ts:37` to `proxy.ts:41` |

### Response headers

| Header | Value | Location |
| --- | --- | --- |
| `Content-Security-Policy` | See the next table | `proxy.ts:22` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | `proxy.ts:23` to `proxy.ts:26` |
| `X-Content-Type-Options` | `nosniff` | `proxy.ts:27` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `proxy.ts:28` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), accelerometer=(self), gyroscope=(self)` | `proxy.ts:29` to `proxy.ts:32` |
| `X-Frame-Options` | `DENY` | `proxy.ts:33` |

### CSP directives

Built by `buildCsp(nonce, { dev, upgradeInsecure })` in `lib/csp.ts:3`. Directives are joined with `; ` (`lib/csp.ts:21`).

| Directive | Value | Location |
| --- | --- | --- |
| `default-src` | `'self'` | `lib/csp.ts:8` |
| `script-src` | `'self' 'nonce-<nonce>' 'strict-dynamic'`, plus `'unsafe-eval'` when `dev` is true | `lib/csp.ts:4` to `lib/csp.ts:6` |
| `style-src` | `'self' 'unsafe-inline'` | `lib/csp.ts:10` |
| `img-src` | `'self' data: blob: https://media.licdn.com` | `lib/csp.ts:11` |
| `font-src` | `'self'` | `lib/csp.ts:12` |
| `connect-src` | `'self' https://vitals.vercel-insights.com` | `lib/csp.ts:13` |
| `frame-src` | `https://www.linkedin.com` plus every entry of `LAB_FRAME_ORIGINS` | `lib/csp.ts:14` |
| `frame-ancestors` | `'none'` | `lib/csp.ts:15` |
| `base-uri` | `'self'` | `lib/csp.ts:16` |
| `form-action` | `'self'` | `lib/csp.ts:17` |
| `object-src` | `'none'` | `lib/csp.ts:18` |
| `worker-src` | `'self' blob:` | `lib/csp.ts:19` |
| `upgrade-insecure-requests` | Present unless `upgradeInsecure === false` | `lib/csp.ts:20` |

## Secret scanning

Two scanners run in the `secrets` CI job (`.github/workflows/ci.yml:49` to `.github/workflows/ci.yml:52`).

### scripts/check-secrets.sh

Scans every tracked file with `grep -E`, skipping binary files and the script itself (`scripts/check-secrets.sh:24`). It prints `check-secrets: clean` and exits 0 when nothing matches (`scripts/check-secrets.sh:47` to `scripts/check-secrets.sh:50`).

| Category | Pattern list location |
| --- | --- |
| Live payment key prefix | `scripts/check-secrets.sh:9` |
| AI provider key prefix | `scripts/check-secrets.sh:10` |
| Cloud access key id shape | `scripts/check-secrets.sh:11` |
| GitHub tokens, classic and fine-grained | `scripts/check-secrets.sh:12` to `scripts/check-secrets.sh:13` |
| Chat app tokens | `scripts/check-secrets.sh:14` |
| PEM private key headers | `scripts/check-secrets.sh:15` |
| JWT shaped strings | `scripts/check-secrets.sh:16` |
| Absolute home directory paths | `scripts/check-secrets.sh:17` |
| Employer and client name strings (two patterns) | `scripts/check-secrets.sh:18` to `scripts/check-secrets.sh:19` |
| The personal contact address, allowed only in `profile.json` and `security.txt` | `scripts/check-secrets.sh:33` to `scripts/check-secrets.sh:40` |
| A tracked `.env`, `.env.local`, `.env.production` or `.env.development` file | `scripts/check-secrets.sh:42` to `scripts/check-secrets.sh:45` |

`CLAUDE.md` is excluded from the scan because it names the patterns on purpose (`scripts/check-secrets.sh:24`).

### .gitleaks.toml

| Setting | Value | Location |
| --- | --- | --- |
| Rules | The default gitleaks rule set (`useDefault = true`) | `.gitleaks.toml:4` |
| Allowlist | The path `CLAUDE\.md` | `.gitleaks.toml:8` |

## Dependabot

File: `.github/dependabot.yml`. Both ecosystems update weekly.

| Ecosystem | Grouping | Ignored | Location |
| --- | --- | --- | --- |
| `npm` | Two groups: `production` and `development` dependencies | Major updates of `typescript`, `@types/node`, `next`, `react`, `react-dom` | `.github/dependabot.yml:2` to `.github/dependabot.yml:22` |
| `github-actions` | One group `actions` with pattern `*` | none | `.github/dependabot.yml:23` to `.github/dependabot.yml:29` |

## CI workflow settings

| Setting | Value | Location |
| --- | --- | --- |
| Triggers (CI) | Pull requests, and pushes to `main` | `.github/workflows/ci.yml:3` to `.github/workflows/ci.yml:6` |
| Triggers (Lighthouse) | Pull requests | `.github/workflows/lighthouse.yml:3` to `.github/workflows/lighthouse.yml:4` |
| Permissions | `contents: read` | `.github/workflows/ci.yml:8` |
| Concurrency | One run per ref, older runs cancelled | `.github/workflows/ci.yml:11` to `.github/workflows/ci.yml:13` |
| Node version | Taken from `.nvmrc` | `.github/workflows/ci.yml:22` |
| Lighthouse timeout | 20 minutes | `.github/workflows/lighthouse.yml:13` |

## Branch protection

Branch protection is a GitHub setting, not a file in the repository. The values below were read from the GitHub API for `main`.

| Setting | Value |
| --- | --- |
| Required status checks | `lint`, `typecheck`, `secrets`, `unit`, `build-e2e`, `lighthouse` |
| Branch must be up to date | yes (`strict: true`) |
| Required pull request reviews | none |
| Enforced for admins | no |

## Related

- [Project structure](project-structure.md) for the script and CI job tables.
- [Security explanation](../explanation/security.md) for the reasoning behind the headers.
