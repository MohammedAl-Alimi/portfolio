# Portfolio Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the complete static portfolio (every page, all launch content, theme, navigation, security headers, SEO, CI and docs skeleton) with a poster image where the 3D hero will go, so later plans only add behaviour.

**Architecture:** Next.js 16 App Router with server-rendered pages reading MDX and JSON from `content/` through Zod-validated loaders. Design tokens live in CSS variables consumed by Tailwind v4. A `proxy.ts` adds a nonce-based CSP and security headers to every response. Playwright, Vitest and Lighthouse CI gate every pull request.

**Tech Stack:** Next.js 16.4, React 19.3, TypeScript strict, Tailwind CSS 4.3, next-mdx-remote 6, zod 4, next-themes, Vitest 5, Playwright 1.64, Lighthouse CI 0.15, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-31-portfolio-design.md`

## Plan sequence

This is plan 1 of 5. Each later plan starts from the merged result of the previous one.

1. **Foundation** (this plan): scaffold, tokens, content model, all pages static, security headers, SEO, CI, docs skeleton.
2. **3D and motion**: persistent canvas, cluster, physics, interactions, device tiers, project hero shape, 404 shape, Lenis, reveals, tilts, page transitions.
3. **Live data**: `/api/github`, `/api/leetcode`, rate limiter, "Right now" panel, LinkedIn highlights embed.
4. **Playground**: Search dialog, terminal, Konami, confetti, cluster sandbox and shader toy lab items.
5. **Docs and launch**: full Diátaxis set with verification pass, OG previews check, domain, CV redirect, final copy pass.

## Global Constraints

- Node.js 20.9 or newer locally, Node.js 24 on Vercel. Package manager is npm with a committed `package-lock.json`; CI uses `npm ci`.
- Every new dependency is checked on npmjs.com before install: publisher matches the known upstream, repository link resolves, weekly downloads above 10,000, package older than 30 days. Record the check in the PR description.
- One small commit per unit of work. Branch per task named `feat/<task>`, `chore/<task>`, `ci/<task>`, `docs/<task>`, `content/<task>`. One pull request per task, self-reviewed from Mohammed's account, merged with a merge commit (no squash). No `Co-Authored-By` trailers, no generator footers.
- `scripts/check-secrets.sh` passes before every push.
- Copy: short sentences, no em dashes, no jargon in navigation labels, button labels or card descriptions. Navigation labels are exactly: Home, Projects, Lab, About, Contact, Search.
- Type sizes: body 18px, hero headline `clamp(3rem, 8vw, 7rem)`, section padding 96px desktop and 64px mobile.
- Every public page passes axe with zero serious or critical violations, and has no horizontal scroll at 320px width.
- Nothing from employer or client work appears in content. Only public personal repos.
- Exactly one `<Canvas>` will exist later. This plan adds none. The hero renders `public/posters/cluster.webp` in its place.
- No `dangerouslySetInnerHTML` except the JSON-LD script in Task 16, which serialises a typed object with `<` escaped.

## Review Focus

1. A project MDX with only `links.repo` set, no `live` or `demo`, must render its page with one button and no empty buttons. Pinned in Task 9 e2e.
2. `/projects?tag=nonexistent` must render the grid with an empty state message, never throw. Pinned in Task 8 unit and e2e.
3. `/projects/does-not-exist` must return the custom 404 page with status 404. Pinned in Task 12 e2e.
4. When `localStorage` throws (private mode), the theme toggle must still switch themes for the session. Pinned in Task 3 unit test with a throwing storage mock.
5. At 320px width, Home, Projects, a project page, Lab and About must have no horizontal scroll and the mobile menu must open and close. Pinned in Task 6 and Task 17 e2e.

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.env.example`, `.nvmrc`
- Modify: `.gitignore` (keep, verify `next-env.d.ts` ignored)

**Interfaces:**
- Produces: a running Next.js 16 app on `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` scripts.

- [ ] **Step 1: Verify dependencies on the registry**

Run for each of `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `@tailwindcss/postcss`, `eslint`, `eslint-config-next`: `npm view <pkg> repository.url maintainers time.modified` and confirm upstream repo and recent publish. Note results in the PR description.

- [ ] **Step 2: Create the app**

Run: `npx create-next-app@16 . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack`
Expected: files above created, `npm run dev` serves a page on port 3000.

- [ ] **Step 3: Harden TypeScript and scripts**

In `tsconfig.json` set `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`. In `package.json` add scripts: `"typecheck": "tsc --noEmit"`, `"check:secrets": "bash scripts/check-secrets.sh"`. Create `.nvmrc` containing `24`. Create `.env.example` with `GITHUB_TOKEN=` and `LEETCODE_USERNAME=` and a comment that the token is server-only.

- [ ] **Step 4: Replace the starter page**

`app/page.tsx` renders `<main><h1>Mohammed Al-Alimi</h1></main>`. `app/layout.tsx` sets `lang="en"`, metadata title `Mohammed Al-Alimi`, description `Interactive portfolio of Mohammed Al-Alimi.` Remove starter assets from `public/`.

- [ ] **Step 5: Verify**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all three exit 0.

- [ ] **Step 6: Commit in units and open the PR**

Commits: `chore: scaffold next 16 app with typescript and tailwind`, `chore: enable strict typescript options`, `chore: add typecheck and secrets scripts`, `chore: add env example and nvmrc`, `feat: replace starter page with name heading`. Push `chore/scaffold`, open PR "Scaffold Next.js app", self-review, merge.

---

### Task 2: Test tooling and CI pipeline

**Files:**
- Create: `vitest.config.ts`, `tests/unit/smoke.test.ts`, `playwright.config.ts`, `tests/e2e/home.spec.ts`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.gitleaks.toml`
- Modify: `package.json` (scripts, devDependencies)

**Interfaces:**
- Produces: `npm run test` (Vitest), `npm run test:e2e` (Playwright against a production build), CI workflow `ci.yml` with jobs `lint`, `typecheck`, `secrets`, `unit`, `build-e2e`.

- [ ] **Step 1: Verify and install**

Verify then install devDependencies: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`, `@axe-core/playwright`.

- [ ] **Step 2: Write the smoke unit test**

```ts
// tests/unit/smoke.test.ts
import { describe, expect, it } from "vitest";
describe("tooling", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 3: Configure Vitest**

`vitest.config.ts`: environment `jsdom`, include `tests/unit/**/*.test.ts?(x)`, alias `@` to project root, setup file `tests/unit/setup.ts` importing `@testing-library/jest-dom/vitest`.

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run`
Expected: 1 passed.

- [ ] **Step 5: Write the home e2e test**

```ts
// tests/e2e/home.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("home renders the name and passes axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mohammed Al-Alimi");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
});
```

- [ ] **Step 6: Configure Playwright**

`playwright.config.ts`: `testDir: "tests/e2e"`, `webServer: { command: "npm run build && npm run start", url: "http://localhost:3000", reuseExistingServer: !process.env.CI }`, projects `chromium-desktop` (1280x800), `webkit-mobile` (iPhone 13 device), `chromium-narrow` (viewport 320x640). Base URL `http://localhost:3000`.

- [ ] **Step 7: Run e2e locally**

Run: `npx playwright install --with-deps chromium webkit && npx playwright test`
Expected: 3 passed (one per project).

- [ ] **Step 8: Add CI workflow**

`.github/workflows/ci.yml` on `pull_request` and `push` to `main`. Node 24 with `actions/setup-node` cache npm. Jobs: `lint` (`npm ci`, `npm run lint`), `typecheck`, `secrets` (`bash scripts/check-secrets.sh` and `gitleaks/gitleaks-action@v2`), `unit` (`npx vitest run`), `build-e2e` (`npx playwright install --with-deps chromium webkit`, `npx playwright test`, upload `playwright-report` on failure). `.gitleaks.toml` extends default with an allowlist for `CLAUDE.md`. `.github/dependabot.yml` for npm weekly and github-actions weekly.

- [ ] **Step 9: Protect main**

Run: `gh api -X PUT repos/MohammedAl-Alimi/portfolio/branches/main/protection -f required_status_checks[strict]=true -f required_status_checks[contexts][]=lint -f required_status_checks[contexts][]=typecheck -f required_status_checks[contexts][]=secrets -f required_status_checks[contexts][]=unit -f required_status_checks[contexts][]=build-e2e -F enforce_admins=false -F required_pull_request_reviews=null -F restrictions=null`
Expected: 200 and `main` shows required checks in GitHub settings.

- [ ] **Step 10: Commit in units and open the PR**

Commits: `test: add vitest with smoke test`, `test: add playwright with home smoke and axe check`, `ci: add lint, typecheck, secrets, unit and e2e workflow`, `ci: add gitleaks config and dependabot`. Push `ci/pipeline`, open PR, confirm all checks green, self-review, merge.

---

### Task 3: Design tokens, fonts and theme

**Files:**
- Create: `components/ui/ThemeProvider.tsx`, `components/ui/ThemeToggle.tsx`, `lib/fonts.ts`, `tests/unit/theme-toggle.test.tsx`
- Modify: `app/globals.css`, `app/layout.tsx`

**Interfaces:**
- Produces: CSS variables `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--accent-1` to `--accent-6`, `--radius-sm` (12px), `--radius-md` (20px), `--radius-lg` (32px), `--motion-fast` (150ms), `--motion-base` (300ms), `--motion-slow` (500ms), `--motion-xslow` (800ms), `--ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`); Tailwind theme names `bg-bg`, `text-text`, `text-muted`, `bg-surface`, `border-border`, `font-display`, `font-sans`; `<ThemeProvider>` wrapping the app; `<ThemeToggle />` button with `aria-label="Switch to dark theme"` or `"Switch to light theme"`.

- [ ] **Step 1: Verify and install**

Verify then install `next-themes`.

- [ ] **Step 2: Define tokens**

In `app/globals.css` under `@import "tailwindcss";` add `@theme` mapping colours to the CSS variables, then `:root` light values and `.dark` dark values. Light: bg `#FFFBF5`, surface `#FFFFFF`, text `#17161A`, muted `#5F5B66`, border `#EAE4DA`. Dark: bg `#121117`, surface `#1B1A22`, text `#F6F3EE`, muted `#A39FAD`, border `#2A2833`. Accents (both themes): `#FF6B35`, `#FFD23F`, `#3BCEAC`, `#5C7CFA`, `#F06595`, `#A78BFA`. Base font size 18px on `html`. Set `color-scheme` per theme.

- [ ] **Step 3: Fonts**

`lib/fonts.ts` exports `display` (Bricolage Grotesque, weights 500 to 800, `variable: "--font-display"`) and `sans` (Inter, `variable: "--font-sans"`) from `next/font/google`. Apply both variables on `<html>` in `app/layout.tsx`. Map `font-display` and `font-sans` in `@theme`.

- [ ] **Step 4: Write the failing toggle test**

```tsx
// tests/unit/theme-toggle.test.tsx
it("toggles the html class even when storage throws", async () => {
  vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
  const button = screen.getByRole("button", { name: /switch to dark theme/i });
  await userEvent.click(button);
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(screen.getByRole("button", { name: /switch to light theme/i })).toBeInTheDocument();
});
```

- [ ] **Step 5: Run to verify it fails**

Run: `npx vitest run tests/unit/theme-toggle.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 6: Implement**

`ThemeProvider.tsx` is a client component wrapping `next-themes` `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and forwarding a `nonce` prop. `ThemeToggle.tsx` is a client component using `useTheme`, rendering a 44px by 44px button with sun and moon inline SVG icons, `aria-label` as specified, and `suppressHydrationWarning` handling via a mounted flag.

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run tests/unit/theme-toggle.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit in units and open the PR**

Commits: `feat: add colour, radius and motion tokens for light and dark`, `feat: add display and body fonts`, `test: add theme toggle test with throwing storage`, `feat: add theme provider and toggle`. Push `feat/design-tokens`, open PR, self-review, merge.

---

### Task 4: Content schemas and loaders

**Files:**
- Create: `lib/schemas.ts`, `lib/content.ts`, `scripts/validate-content.ts`, `content/profile.json`, `content/highlights.json`, `content/projects/crowd-detection.mdx`, `content/lab/.gitkeep`, `tests/unit/schemas.test.ts`, `tests/unit/content.test.ts`, `tests/fixtures/content/projects/valid.mdx`, `tests/fixtures/content/projects/invalid-color.mdx`
- Modify: `package.json` (add `"prebuild": "npm run validate:content"`, `"validate:content": "tsx scripts/validate-content.ts"`)

**Interfaces:**
- Produces, in `lib/schemas.ts`: `projectFrontmatterSchema`, `labFrontmatterSchema`, `highlightSchema`, `profileSchema` (all `z.strictObject`), and types `ProjectFrontmatter`, `LabFrontmatter`, `Highlight`, `Profile`, plus `ShapeName = "sphere" | "box" | "icosahedron" | "torusKnot" | "capsule" | "octahedron"` and `TagName = "ai" | "computer-vision" | "agents" | "security" | "data" | "web" | "privacy"`.
- Produces, in `lib/content.ts`: `getProjects(dir?: string): Promise<Project[]>` sorted by `order` ascending then `year` descending; `getProject(slug: string, dir?: string): Promise<Project | null>`; `getLabItems(dir?)`, `getLabItem(slug, dir?)`; `getHighlights(dir?)`: `Highlight[]`; `getProfile(dir?)`: `Profile`; `getAdjacentProjects(slug, dir?)`: `{ previous: Project | null; next: Project | null }`. `Project = { frontmatter: ProjectFrontmatter; body: string }`, `LabItem` likewise. `dir` defaults to `path.join(process.cwd(), "content")`.

- [ ] **Step 1: Verify and install**

Verify then install `zod`, `gray-matter`, and devDependency `tsx`.

- [ ] **Step 2: Write failing schema tests**

```ts
// tests/unit/schemas.test.ts
it("accepts a full project frontmatter", () => {
  expect(projectFrontmatterSchema.safeParse(validProject).success).toBe(true);
});
it("rejects a non-hex color", () => {
  const r = projectFrontmatterSchema.safeParse({ ...validProject, color: "orange" });
  expect(r.success).toBe(false);
});
it("rejects unknown keys", () => {
  expect(projectFrontmatterSchema.safeParse({ ...validProject, extra: 1 }).success).toBe(false);
});
it("rejects a non-https link", () => {
  expect(projectFrontmatterSchema.safeParse({ ...validProject, links: { repo: "javascript:alert(1)" } }).success).toBe(false);
});
it("requires coverAlt when cover is set", () => {
  expect(projectFrontmatterSchema.safeParse({ ...validProject, coverAlt: undefined }).success).toBe(false);
});
it("highlight requires a linkedin.com url", () => {
  expect(highlightSchema.safeParse({ url: "https://example.com/x", date: "2026-01-01", caption: "x" }).success).toBe(false);
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/unit/schemas.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement schemas**

`projectFrontmatterSchema`: `title` (1 to 80 chars), `slug` (`/^[a-z0-9-]+$/`), `tagline` (1 to 120), `color` (`/^#[0-9A-Fa-f]{6}$/`), `shape` (ShapeName enum), `tags` (array of TagName, 1 to 5), `year` (int 2018 to 2100), `role` (string), `featured` (boolean default false), `order` (int, default 99), `links` (strictObject of optional `repo`, `live`, `demo`, each `z.url()` refined to protocol `https:`), `cover` (optional string starting with `/projects/`), `coverAlt` (optional string), `stack` (array of strings, 1 to 12). Refine: `coverAlt` required when `cover` present. `labFrontmatterSchema`: `title`, `slug`, `description` (1 to 140), `kind` (`component` or `iframe`), `component` optional, `url` optional https, `thumbnail` starting `/lab/`, `thumbnailAlt`, `order`; refine `component` required for `kind: component`, `url` required for `iframe`. `highlightSchema`: `url` https with hostname `www.linkedin.com` or `linkedin.com`, `date` ISO date string, `caption` 1 to 140. `profileSchema`: `name`, `headline`, `bio`, `email` (`z.email()`), `location`, `availability`, `socials` strictObject `{ github, linkedin }` https urls, `decorationColors` array of hex, 2 to 6.

- [ ] **Step 5: Run schema tests**

Run: `npx vitest run tests/unit/schemas.test.ts`
Expected: PASS.

- [ ] **Step 6: Write failing loader tests**

```ts
// tests/unit/content.test.ts (uses tests/fixtures/content)
it("loads projects sorted by order then year desc", async () => {
  const p = await getProjects(fixturesDir);
  expect(p.map(x => x.frontmatter.slug)).toEqual(["valid", "second"]);
});
it("returns null for unknown slug", async () => {
  expect(await getProject("nope", fixturesDir)).toBeNull();
});
it("throws a message naming the file and field on invalid frontmatter", async () => {
  await expect(getProjects(invalidFixturesDir)).rejects.toThrow(/invalid-color\.mdx.*color/);
});
it("returns previous and next by sorted position", async () => {
  const { previous, next } = await getAdjacentProjects("valid", fixturesDir);
  expect(previous).toBeNull();
  expect(next?.frontmatter.slug).toBe("second");
});
```

Fixtures: `valid.mdx` (order 1, year 2026), `second.mdx` (order 2, year 2025) in `tests/fixtures/content/projects/`; `tests/fixtures/content-invalid/projects/invalid-color.mdx` with `color: orange`.

- [ ] **Step 7: Run to verify failure, then implement loaders**

Read files with `fs/promises`, parse with `gray-matter`, validate with the schema, and on failure throw `new Error(\`Invalid frontmatter in ${file}: ${issues}\`)` where issues joins `path.join(".")` and message. Mark `lib/content.ts` with `import "server-only"`.

- [ ] **Step 8: Run loader tests**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: PASS.

- [ ] **Step 9: Validation script**

`scripts/validate-content.ts` calls `getProjects()`, `getLabItems()`, `getHighlights()`, `getProfile()`, asserts slugs are unique, asserts each `cover` and `thumbnail` file exists under `public/`, prints counts, exits 1 on any error. Wire `prebuild` and `validate:content` scripts.

- [ ] **Step 10: First real content**

`content/profile.json` with Mohammed's name, headline `I build AI systems, agents and playful tools`, a 2-sentence bio, email, location, availability line `Open to roles from 2027`, socials (GitHub `https://github.com/MohammedAl-Alimi`, LinkedIn placeholder to be replaced by Mohammed), decoration colours (4 accents). `content/highlights.json` as `[]`. `content/projects/crowd-detection.mdx` with full frontmatter (color `#FF6B35`, shape `icosahedron`, featured, order 1, year 2026, repo `https://github.com/MohammedAl-Alimi/ct_ai_analysis`, demo `https://github.com/MohammedAl-Alimi/crowd_monitoring_dashboard`) and body sections Problem, What I built, How it works, Stack, Outcome, What I learned, drafted from the two repos' READMEs. Add `public/projects/crowd-detection/cover.webp` (export a screenshot of the dashboard demo at 1600 by 900, under 150 KB).

- [ ] **Step 11: Run validation and build**

Run: `npm run validate:content && npm run build`
Expected: prints `projects: 1, lab: 0, highlights: 0` and build succeeds.

- [ ] **Step 12: Commit in units and open the PR**

Commits: `feat: add zod schemas for project, lab, highlight and profile content`, `test: add schema tests`, `feat: add content loaders with sorting and adjacency`, `test: add content loader tests with fixtures`, `chore: add validate-content script to prebuild`, `content: add profile and empty highlights`, `content: add crowd detection case study`. Push `feat/content-model`, open PR, self-review, merge.

---

### Task 5: UI primitives

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Tag.tsx`, `components/ui/Card.tsx`, `components/ui/Skeleton.tsx`, `components/ui/Container.tsx`, `components/ui/Section.tsx`, `lib/cn.ts`, `tests/unit/button.test.tsx`

**Interfaces:**
- Produces: `Button({ variant: "primary" | "secondary" | "ghost", size?: "md" | "lg", href?: string, external?: boolean, ...buttonProps })` rendering `next/link` when `href` is internal, `<a target="_blank" rel="noopener noreferrer">` when `external`, else `<button>`; `Tag({ children, color?: string })`; `Card({ color?: string, href?: string, children })` with `rounded-[var(--radius-md)]` surface and border; `Skeleton({ className })`; `Container` (max width 1200px, 16px side gutter under 768px, 32px above); `Section({ id?, title?, children })` with 96px desktop and 64px mobile vertical padding; `cn(...classes)` joining with `clsx` and `tailwind-merge`.

- [ ] **Step 1: Verify and install**

Verify then install `clsx`, `tailwind-merge`.

- [ ] **Step 2: Write failing Button tests**

```tsx
it("renders an internal link for href", () => {
  render(<Button href="/projects">See projects</Button>);
  expect(screen.getByRole("link", { name: "See projects" })).toHaveAttribute("href", "/projects");
});
it("adds rel noopener for external links", () => {
  render(<Button href="https://github.com/x" external>GitHub</Button>);
  expect(screen.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
});
it("renders a button when no href", () => {
  render(<Button onClick={() => {}}>Go</Button>);
  expect(screen.getByRole("button")).toBeInTheDocument();
});
```

- [ ] **Step 3: Run to verify failure, implement primitives, run to pass**

Minimum tap target 44px. Primary: `bg-text text-bg`; secondary: `border border-border bg-surface`; ghost: transparent. Focus ring visible with `outline-2 outline-offset-2`.

- [ ] **Step 4: Commit in units and open the PR**

Commits: `feat: add cn helper`, `test: add button tests`, `feat: add button with link and external variants`, `feat: add tag, card and skeleton`, `feat: add container and section layout primitives`. Push `feat/ui-primitives`, open PR, self-review, merge.

---

### Task 6: Navigation, footer and root layout

**Files:**
- Create: `components/ui/Nav.tsx`, `components/ui/MobileMenu.tsx`, `components/ui/Footer.tsx`, `components/ui/Wordmark.tsx`, `lib/nav.ts`, `tests/e2e/navigation.spec.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `getProfile()` from Task 4, `ThemeToggle`, `Button`, `Container`.
- Produces: `NAV_ITEMS: { label: "Home" | "Projects" | "Lab" | "About" | "Contact"; href: string }[]` in `lib/nav.ts` with Contact href `/#contact`; `<Nav />` (server component rendering `MobileMenu` client island) with a visible `Search` button placeholder (`aria-label="Search"`, disabled until plan 4, `data-search-trigger`); `<Footer />` with `id="contact"`, email button `mailto:`, GitHub, LinkedIn, `Download CV` linking `/cv`.

- [ ] **Step 1: Write failing e2e**

```ts
// tests/e2e/navigation.spec.ts
test("desktop nav links are visible and labelled", async ({ page }) => {
  await page.goto("/");
  for (const label of ["Home", "Projects", "Lab", "About", "Contact"]) {
    await expect(page.getByRole("navigation").getByRole("link", { name: label })).toBeVisible();
  }
});
test("mobile menu opens and closes at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
test("footer has contact actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#contact").getByRole("link", { name: /say hi/i })).toHaveAttribute("href", /^mailto:/);
  await expect(page.locator("#contact").getByRole("link", { name: "Download CV" })).toHaveAttribute("href", "/cv");
});
```

- [ ] **Step 2: Run to verify failure, implement, run to pass**

Nav: sticky top, `backdrop-blur`, height 72px, wordmark left, links centre (hidden under 768px), Search button and ThemeToggle right, `Menu` button under 768px. MobileMenu: `role="dialog" aria-label="Menu"`, full screen, focus trapped, closes on Escape and on link click, body scroll locked while open. Footer: large "Say hi" primary button with `mailto:` from profile email, social links, CV button, a one-line availability from profile.

- [ ] **Step 3: Commit in units and open the PR**

Commits: `feat: add nav items definition`, `feat: add wordmark`, `test: add navigation e2e`, `feat: add desktop nav with search placeholder and theme toggle`, `feat: add mobile menu dialog`, `feat: add footer with contact actions`, `feat: wire nav and footer into root layout`. Push `feat/navigation`, open PR, self-review, merge.

---

### Task 7: Home page, static version

**Files:**
- Create: `components/home/Hero.tsx`, `components/home/HeroPoster.tsx`, `components/home/WhatIBuild.tsx`, `components/home/FeaturedProjects.tsx`, `components/projects/ProjectCard.tsx`, `public/posters/cluster.webp`, `tests/e2e/home.spec.ts` (extend)
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getProjects()`, `getProfile()`, `Button`, `Card`, `Tag`, `Section`.
- Produces: `ProjectCard({ project: Project, size?: "md" | "lg" })` linking to `/projects/[slug]`, showing cover or colour block, title, tagline, tags, year; `HeroPoster()` rendering `next/image` of `/posters/cluster.webp` with `priority` and alt `Colourful floating shapes`; `Hero` with `data-hero-slot` wrapper where plan 2 mounts the 3D view.

- [ ] **Step 1: Make the poster**

Render a 1600 by 1200 WebP of 8 soft candy shapes on transparent background using the six accent colours (generate with a short Node script using `sharp` composited SVG circles and rounded rects, or export from Figma). Under 120 KB. Save to `public/posters/cluster.webp`.

- [ ] **Step 2: Extend home e2e**

```ts
test("hero shows name, role and both buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mohammed Al-Alimi");
  await expect(page.getByText("I build AI systems, agents and playful tools")).toBeVisible();
  await expect(page.getByRole("link", { name: "See projects" })).toHaveAttribute("href", "/projects");
  await expect(page.getByRole("link", { name: "Download CV" }).first()).toHaveAttribute("href", "/cv");
});
test("featured strip lists featured projects", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Featured projects" }).getByRole("link")).toHaveCount(1);
});
```

- [ ] **Step 3: Run to verify failure, implement, run to pass**

Hero: two-column grid above 1024px (text 5 columns, poster 7), stacked below with poster first. Headline uses `font-display` at `clamp(3rem, 8vw, 7rem)`. Hint text under poster: `Drag the shapes. Click one to open a project.` rendered now but visually muted (becomes interactive in plan 2). WhatIBuild: three cards, each linking to `/projects?tag=` with `ai`, `agents`, `security`. FeaturedProjects: `<section aria-label="Featured projects">` horizontal scroll-snap row of `ProjectCard size="lg"`. Page order: Hero, WhatIBuild, FeaturedProjects, then a `RightNow` placeholder section (`<Section id="right-now" title="Right now">` with three `Skeleton`s, filled in plan 3), then a `Highlights` placeholder section hidden when `getHighlights()` is empty.

- [ ] **Step 4: Commit in units and open the PR**

Commits: `feat: add cluster poster image`, `feat: add project card`, `test: extend home e2e for hero and featured strip`, `feat: add hero with poster and actions`, `feat: add what I build cards`, `feat: add featured projects strip`, `feat: assemble home page with placeholders for live sections`. Push `feat/home`, open PR, self-review, merge.

---

### Task 8: Projects grid with tag filters

**Files:**
- Create: `app/projects/page.tsx`, `components/projects/ProjectGrid.tsx`, `components/projects/TagFilter.tsx`, `lib/filter.ts`, `tests/unit/filter.test.ts`, `tests/e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `getProjects()`, `ProjectCard`, `TagName`.
- Produces: `parseTagParam(value: string | string[] | undefined): TagName | null` and `filterProjects(projects: Project[], tag: TagName | null): Project[]` in `lib/filter.ts`; `TagFilter({ active: TagName | null })` rendering chips as links to `/projects?tag=<tag>` and an `All` chip to `/projects`.

- [ ] **Step 1: Write failing unit tests**

```ts
it("returns null for unknown or missing tag", () => {
  expect(parseTagParam("nonexistent")).toBeNull();
  expect(parseTagParam(undefined)).toBeNull();
  expect(parseTagParam(["ai", "web"])).toBe("ai");
});
it("filters by tag and keeps order", () => {
  expect(filterProjects(projects, "ai").map(p => p.frontmatter.slug)).toEqual(["crowd-detection"]);
  expect(filterProjects(projects, null)).toHaveLength(projects.length);
});
```

- [ ] **Step 2: Write failing e2e**

```ts
test("unknown tag shows empty state, not an error", async ({ page }) => {
  const res = await page.goto("/projects?tag=nonexistent");
  expect(res?.status()).toBe(200);
  await expect(page.getByText("No projects with that tag yet.")).toBeVisible();
});
test("tag chip filters and updates url", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("link", { name: "ai" }).click();
  await expect(page).toHaveURL(/tag=ai/);
  await expect(page.getByRole("link", { name: /crowd detection/i })).toBeVisible();
});
```

- [ ] **Step 3: Run to verify failure, implement, run to pass**

Page is a server component reading `searchParams`. Unknown tag: render grid empty with the exact empty-state copy above and the `All` chip highlighted. Grid: CSS grid, featured cards span 2 columns above 1024px. Page title `Projects`, intro line `Things I have shipped. Newest first.`

- [ ] **Step 4: Commit in units and open the PR**

Commits: `feat: add tag param parsing and project filtering`, `test: add filter unit tests`, `test: add projects grid e2e`, `feat: add tag filter chips`, `feat: add projects grid page`. Push `feat/projects-grid`, open PR, self-review, merge.

---

### Task 9: Project detail page

**Files:**
- Create: `app/projects/[slug]/page.tsx`, `app/projects/[slug]/opengraph-image.tsx`, `components/projects/ProjectHero.tsx`, `components/projects/ProjectMeta.tsx`, `components/projects/ProjectBody.tsx`, `components/projects/AdjacentProjects.tsx`, `components/mdx/components.tsx`, `lib/color.ts`, `tests/unit/color.test.ts`, `tests/e2e/project-page.spec.ts`

**Interfaces:**
- Consumes: `getProject`, `getProjects`, `getAdjacentProjects`, `Button`, `Tag`, `Card`.
- Produces: `generateStaticParams` from all slugs; `ProjectHero({ project })` with `data-project-shape-slot` and `style={{ "--project-color": color }}` for plan 2; `ProjectBody({ source: string })` compiling MDX with `next-mdx-remote/rsc` `compileMDX` and the component map (h2, h3, p, ul, ol, li, a with https allowlist, img via `next/image`, code, pre).

- [ ] **Step 1: Verify and install**

Verify then install `next-mdx-remote`.

- [ ] **Step 2: Write failing e2e**

```ts
test("project page renders hero, sections and only the links present", async ({ page }) => {
  await page.goto("/projects/crowd-detection");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI-Powered Crowd Detection");
  await expect(page.getByRole("link", { name: "Repo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Demo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Live" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Problem" })).toBeVisible();
});
test("project page has an og image", async ({ request }) => {
  const res = await request.get("/projects/crowd-detection/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
```

- [ ] **Step 3: Run to verify failure, implement, run to pass**

Page calls `notFound()` when `getProject` returns null. `generateMetadata` sets title `${title} | Mohammed Al-Alimi`, description tagline, `openGraph.images` default. Hero background `var(--project-color)` with text colour chosen by a `contrastText(hex)` helper in `lib/color.ts` (returns `#17161A` or `#F6F3EE` by WCAG relative luminance). Buttons rendered only for links present, labels `Repo`, `Live`, `Demo`. Meta sidebar: year, role, stack tags. Body: MDX. Bottom: previous and next `ProjectCard`s. OG image: 1200 by 630, project colour background, title in display font, `mohammed` wordmark.

- [ ] **Step 4: Unit test the contrast helper**

```ts
it("picks dark text on yellow and light text on indigo", () => {
  expect(contrastText("#FFD23F")).toBe("#17161A");
  expect(contrastText("#5C7CFA")).toBe("#F6F3EE");
});
```

- [ ] **Step 5: Commit in units and open the PR**

Commits: `feat: add contrast text helper`, `test: add contrast helper tests`, `feat: add mdx component map with https-only links`, `test: add project page e2e`, `feat: add project hero and meta`, `feat: add project page with static params and not found`, `feat: add adjacent projects navigation`, `feat: add per-project open graph image`. Push `feat/project-page`, open PR, self-review, merge.

---

### Task 10: About page and CV redirect

**Files:**
- Create: `app/about/page.tsx`, `components/about/Timeline.tsx`, `content/about.mdx`, `app/cv/route.ts`, `public/cv.pdf`, `tests/e2e/about.spec.ts`
- Modify: `lib/schemas.ts` (add `aboutFrontmatterSchema` with `timeline: { year: string; title: string; detail: string }[]` and `outside: string[]`), `lib/content.ts` (add `getAbout()`)

**Interfaces:**
- Produces: `getAbout(dir?)`: `{ frontmatter: AboutFrontmatter; body: string }`; `GET /cv` responds 308 to `/cv.pdf`.

- [ ] **Step 1: Write failing e2e**

```ts
test("about has story, timeline and cv button", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("list", { name: "Timeline" }).getByRole("listitem")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Download CV" }).first()).toHaveAttribute("href", "/cv");
});
test("/cv redirects to the pdf", async ({ request }) => {
  const res = await request.get("/cv", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toContain("/cv.pdf");
});
```

- [ ] **Step 2: Run to verify failure, implement, run to pass**

Copy `cv.pdf` from the mohammed-cv repo into `public/`. `content/about.mdx` with 4 timeline entries (study, agency work, B.Sc. thesis, now) and 4 to 6 short paragraphs drafted for Mohammed to edit. Timeline is `<ol aria-label="Timeline">`.

- [ ] **Step 3: Commit in units and open the PR**

Commits: `feat: add about schema and loader`, `content: add about story and timeline`, `test: add about and cv e2e`, `feat: add about page with timeline`, `feat: add cv redirect route and pdf`. Push `feat/about`, open PR, self-review, merge.

---

### Task 11: Lab pages, iframe kind

**Files:**
- Create: `app/lab/page.tsx`, `app/lab/[slug]/page.tsx`, `components/lab/LabCard.tsx`, `components/lab/LabFrame.tsx`, `components/lab/HowItWorks.tsx`, `content/lab/crowd-dashboard.mdx`, `public/lab/crowd-dashboard.webp`, `tests/e2e/lab.spec.ts`

**Interfaces:**
- Consumes: `getLabItems`, `getLabItem`, `Card`, `Button`.
- Produces: `LabFrame({ url, title })` rendering `<iframe sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" loading="lazy" title={title}>`; `LabCard({ item })` with `Try it` button; `HowItWorks({ children })` as a `<details>` with summary `How it works`. For `kind: component` items the detail page renders a `ComponentSlot` that looks up a registry in `components/lab/registry.ts` (`Record<string, ComponentType>`), empty in this plan and filled in plans 2 and 4.

- [ ] **Step 1: Write failing e2e**

```ts
test("lab lists items with plain language and try buttons", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByText("Small experiments and live demos. Click anything to try it.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it" })).toHaveCount(1);
});
test("lab detail renders a sandboxed iframe and a how it works fold", async ({ page }) => {
  await page.goto("/lab/crowd-dashboard");
  const frame = page.locator("iframe");
  await expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-same-origin");
  await expect(page.getByText("How it works")).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure, implement, run to pass**

`content/lab/crowd-dashboard.mdx`: kind `iframe`, url of the public crowd dashboard deployment (set to the GitHub Pages or Vercel URL of `crowd_monitoring_dashboard`; if none exists yet, deploy that repo's static files to Vercel first and use that URL), description `A live dashboard for counting people in a venue, running on demo data.`, body with the technical note.

- [ ] **Step 3: Commit in units and open the PR**

Commits: `feat: add lab card and sandboxed frame`, `feat: add how it works fold`, `test: add lab e2e`, `feat: add lab grid page`, `feat: add lab detail page with component registry`, `content: add crowd dashboard lab item`. Push `feat/lab`, open PR, self-review, merge.

---

### Task 12: 404 and error pages

**Files:**
- Create: `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `tests/e2e/errors.spec.ts`

**Interfaces:**
- Produces: `not-found.tsx` with `data-notfound-shape-slot` for plan 2, copy `This page wandered off.`, buttons `Home` and `Projects`; `error.tsx` client component with copy `Something broke on our side.`, a `Try again` button calling `reset()`, and a request ID line reading `error.digest`.

- [ ] **Step 1: Write failing e2e**

```ts
test("unknown project returns the custom 404 with status 404", async ({ page }) => {
  const res = await page.goto("/projects/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page wandered off.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure, implement, run to pass**

- [ ] **Step 3: Commit in units and open the PR**

Commits: `test: add 404 e2e`, `feat: add custom not found page`, `feat: add error and global error pages`. Push `feat/error-pages`, open PR, self-review, merge.

---

### Task 13: Launch content

**Files:**
- Create: `content/projects/noah-hub.mdx`, `content/projects/agent-security-playbook.mdx`, `content/projects/is-my-app-safe.mdx`, `content/projects/unlearned.mdx`, `content/projects/hyrox-tracker.mdx`, `content/projects/bloomline.mdx`, covers under `public/projects/<slug>/cover.webp`

**Interfaces:**
- Consumes: schemas from Task 4. Shapes and colours: noah-hub `#5C7CFA` torusKnot order 2, agent-security-playbook `#3BCEAC` box order 3, is-my-app-safe `#F06595` sphere order 4, unlearned `#FFD23F` capsule order 5, hyrox-tracker `#A78BFA` octahedron order 6, bloomline `#FF6B35` sphere order 7. First four `featured: true`.

- [ ] **Step 1: Draft each case study**

Read each repo's README and recent commits. Full sections for the featured four, Problem, What I built and Outcome only for the other three. Every claim traceable to the repo. No employer or client names. Add a 1600 by 900 cover for each, under 150 KB, from a screenshot of the live app or README banner.

- [ ] **Step 2: Validate and run e2e**

Run: `npm run validate:content && npx playwright test tests/e2e/projects.spec.ts tests/e2e/home.spec.ts`
Expected: `projects: 7`, home featured strip count updated to 4 in the test, all pass.

- [ ] **Step 3: Commit in units and open the PR**

One commit per project: `content: add noah hub case study`, and so on, plus `test: update featured count to four`. Push `content/launch-projects`, open PR, self-review, merge.

---

### Task 14: Security headers and CSP

**Files:**
- Create: `proxy.ts`, `lib/csp.ts`, `public/.well-known/security.txt`, `tests/unit/csp.test.ts`, `tests/e2e/security.spec.ts`
- Modify: `app/layout.tsx` (read nonce from `headers()` and pass to `ThemeProvider` and `next/script` uses), `next.config.ts` (`poweredByHeader: false`)

**Interfaces:**
- Produces: `buildCsp(nonce: string, options: { dev: boolean }): string` in `lib/csp.ts`; `proxy.ts` generating a nonce per request with `crypto.randomUUID()` base64, setting `Content-Security-Policy`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), accelerometer=(self), gyroscope=(self)`, `X-Frame-Options: DENY`, and forwarding the nonce in the `x-nonce` request header.

- [ ] **Step 1: Write failing unit tests**

```ts
it("builds a strict csp with nonce and allowed frames", () => {
  const csp = buildCsp("abc", { dev: false });
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
  expect(csp).toContain("frame-src https://www.linkedin.com");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain("unsafe-inline");
});
it("allows eval only in dev", () => {
  expect(buildCsp("abc", { dev: true })).toContain("'unsafe-eval'");
  expect(buildCsp("abc", { dev: false })).not.toContain("'unsafe-eval'");
});
```

CSP directives: `default-src 'self'`; `script-src 'self' 'nonce-<n>' 'strict-dynamic'` plus `'unsafe-eval'` in dev; `style-src 'self' 'unsafe-inline'` (required by Next font and inline style attributes, documented in `docs/explanation/security.md` in plan 5); `img-src 'self' data: blob: https://media.licdn.com`; `font-src 'self'`; `connect-src 'self' https://vitals.vercel-insights.com`; `frame-src https://www.linkedin.com <crowd dashboard origin>`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`; `object-src 'none'`; `worker-src 'self' blob:`; `upgrade-insecure-requests`.

- [ ] **Step 2: Write failing e2e**

```ts
test("every public page sends the security headers", async ({ request }) => {
  for (const path of ["/", "/projects", "/projects/crowd-detection", "/lab", "/about"]) {
    const res = await request.get(path);
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  }
});
test("pages render with the csp active (no blocked inline scripts)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error" && /Content Security Policy/.test(m.text())) errors.push(m.text()); });
  await page.goto("/");
  await page.goto("/projects/crowd-detection");
  expect(errors).toEqual([]);
});
```

- [ ] **Step 3: Run to verify failure, implement, run to pass**

`security.txt` from the playbook template with `Contact: mailto:` the profile email and `Expires` one year out.

- [ ] **Step 4: Commit in units and open the PR**

Commits: `feat: add csp builder`, `test: add csp unit tests`, `feat: add proxy with nonce csp and security headers`, `feat: thread nonce into layout and theme provider`, `test: add security headers e2e`, `chore: add security.txt and disable powered-by header`. Push `feat/security-headers`, open PR, self-review, merge.

---

### Task 15: Lighthouse CI and Vercel preview

**Files:**
- Create: `lighthouserc.json`, `.github/workflows/lighthouse.yml`, `vercel.json` (only `"framework": "nextjs"` and `"github": { "silent": true }` if needed)

**Interfaces:**
- Produces: Vercel project `portfolio` in Mohammed's personal scope linked to the GitHub repo with preview deployments per PR and production on `main`; Lighthouse CI asserting on `/`, `/projects/crowd-detection`, `/lab`: performance 0.85, accessibility 0.95, best practices 0.95, SEO 0.95, mobile preset, 3 runs median.

- [ ] **Step 1: Create the Vercel project**

Use the Vercel MCP `create_git_project` (or `vercel link` then `vercel git connect`) in the personal scope. Enable deployment protection for previews (Vercel Authentication), none for production. Add env `LEETCODE_USERNAME` placeholder (value set in plan 3) and note `GITHUB_TOKEN` for plan 3.

- [ ] **Step 2: Lighthouse config**

`lighthouserc.json` with `collect.startServerCommand: "npm run start"`, `collect.url` the three paths, `settings.preset: "desktop"` off (use mobile default), `numberOfRuns: 3`, `assert.assertions` as above with `"error"` level, `upload.target: "temporary-public-storage"`.

- [ ] **Step 3: Workflow**

`.github/workflows/lighthouse.yml` on `pull_request`: checkout, Node 24, `npm ci`, `npm run build`, `npx @lhci/cli autorun`. Add `lighthouse` to the required checks on `main`.

- [ ] **Step 4: Verify**

Open the PR and confirm the Lighthouse job passes and posts scores. If performance is under 0.85, fix before merging (likely poster size or font loading).

- [ ] **Step 5: Commit in units and open the PR**

Commits: `ci: add lighthouse ci with mobile budgets`, `chore: add vercel project config`, `ci: require lighthouse check on main`. Push `ci/lighthouse`, open PR, self-review, merge.

---

### Task 16: SEO and metadata

**Files:**
- Create: `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `components/seo/JsonLd.tsx`, `lib/site.ts`, `tests/e2e/seo.spec.ts`
- Modify: `app/layout.tsx` (metadataBase, default OG, twitter card, JsonLd)

**Interfaces:**
- Produces: `SITE_URL` in `lib/site.ts` from `process.env.NEXT_PUBLIC_SITE_URL ?? "https://portfolio-mohammedal-alimi.vercel.app"` (non-secret, allowed as public); `JsonLd({ data })` serialising with `JSON.stringify(data).replace(/</g, "\\u003c")` into a `<script type="application/ld+json" nonce>`; Person schema with name, url, sameAs from profile socials.

- [ ] **Step 1: Write failing e2e**

```ts
test("sitemap lists every project and lab item", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/projects/crowd-detection");
  expect(xml).toContain("/lab/crowd-dashboard");
  expect(xml).toContain("/about");
});
test("home has person json-ld and og tags", async ({ page }) => {
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(ld ?? "{}")["@type"]).toBe("Person");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});
```

- [ ] **Step 2: Run to verify failure, implement, run to pass**

`robots.ts` allows all, points to sitemap. Default OG image 1200 by 630 with name and headline on the poster shapes.

- [ ] **Step 3: Commit in units and open the PR**

Commits: `feat: add site url helper`, `feat: add sitemap and robots`, `feat: add default open graph image`, `feat: add person json-ld`, `test: add seo e2e`. Push `feat/seo`, open PR, self-review, merge.

---

### Task 17: Accessibility and narrow-viewport sweep

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: all pages.

- [ ] **Step 1: Write the sweep**

```ts
const paths = ["/", "/projects", "/projects/crowd-detection", "/lab", "/lab/crowd-dashboard", "/about", "/nope"];
for (const path of paths) {
  test(`${path} passes axe and has no horizontal scroll at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });
}
```

- [ ] **Step 2: Run, fix every failure in the owning component, run to pass**

- [ ] **Step 3: Commit in units and open the PR**

Commits: `test: add accessibility and narrow viewport sweep`, then one `fix:` commit per component fixed. Push `test/a11y-sweep`, open PR, self-review, merge.

---

### Task 18: Documentation skeleton

**Files:**
- Create: `docs/README.md`, `docs/how-to/run-locally.md`, `docs/reference/project-structure.md`, `docs/reference/content-schema.md`, `docs/reference/configuration.md`, `docs/explanation/architecture.md`
- Modify: `README.md` (status line, screenshot, links into docs)

**Interfaces:**
- Consumes: the merged code of Tasks 1 to 17.

- [ ] **Step 1: Map the code**

List every file under `app/`, `components/`, `lib/`, `content/`, `scripts/` with one line each. This map feeds the pages.

- [ ] **Step 2: Write each page in its Diátaxis type**

`run-locally.md` (how-to: clone, `nvm use`, `npm ci`, copy `.env.example`, `npm run dev`, run tests). `project-structure.md` (reference: tree with one line per folder, citing files). `content-schema.md` (reference: every field of every schema with type, constraint, example, citing `lib/schemas.ts:line`). `configuration.md` (reference: env vars, scripts, CI jobs, required checks). `architecture.md` (explanation: why static content, why `proxy.ts` CSP, the persistent canvas plan, a Mermaid request-flow diagram). `docs/README.md` index with the four headings and a two-sentence orientation.

- [ ] **Step 3: Verify adversarially**

Dispatch a fresh reviewer with the instruction: "Try to disprove every file path, field name, script name and default in these pages by reading the code." Fix everything confirmed.

- [ ] **Step 4: Commit in units and open the PR**

One commit per page: `docs: add run locally guide`, `docs: add project structure reference`, `docs: add content schema reference`, `docs: add configuration reference`, `docs: add architecture explanation`, `docs: add docs index`, `docs: update readme with status and links`. Push `docs/foundation`, open PR, self-review, merge.

---

## Done when

- All 18 PRs merged, `main` green on every required check.
- Production deployment on Vercel shows Home, Projects, 7 project pages, Lab with one item, About, 404, all with the poster in place of the 3D hero.
- Lighthouse mobile on Home is 85 or above.
- `docs/` has the six foundation pages and `README.md` links to them.
