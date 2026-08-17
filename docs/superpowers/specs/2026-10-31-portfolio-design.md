# Portfolio website design spec

Date: 2026-10-31
Status: draft for review
Owner: Mohammed Al-Alimi

## 1. Purpose

A personal portfolio website that does three jobs at once:

1. Convince recruiters and hiring managers in under a minute that Mohammed builds real, shipped software.
2. Act as a living home for every project, experiment and highlight he produces from now on.
3. Express a personal brand: playful, colourful, 3D-forward, and clearly not a template.

Everything in this spec ships in one launch. There is no phased public rollout.

### Success criteria

- A recruiter on a phone, arriving from a LinkedIn link, sees the hero and the first project within 2 seconds and can reach a case study, the CV and the email button without any instruction.
- A visitor with no technical background can navigate every public page using only the top navigation and visible buttons.
- Lighthouse mobile performance 85 or higher, accessibility 95 or higher, on Home, a project page and Lab.
- Adding a new project, lab item or LinkedIn highlight requires one new content file and no code changes.
- The 3D hero runs at 60 fps on an iPhone 13 class device and degrades to a static image on low-end devices without breaking layout.

### Non-goals at launch

- No blog or writing section.
- No contact form, no login, no database.
- No live LinkedIn feed (LinkedIn has no public API for personal posts).
- No 3D outside the hero, the project page hero shape, the 404 page and the Lab sandbox.

## 2. Audience and tone

Primary: recruiters, hiring managers, engineers who screen candidates. Secondary: peers, clients, friends, future self.

Tone: confident, warm, playful, short sentences. No jargon on the main path. Technical depth lives one click deeper (case study bodies, "How it works" folds).

## 3. Architecture

### Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16, App Router, TypeScript, React 19 | Node.js runtime on Vercel Fluid Compute. No Edge runtime. |
| Styling | Tailwind CSS v4, CSS variables for tokens | Light and dark themes. |
| 3D | three, @react-three/fiber, @react-three/drei, @react-three/rapier, @react-three/postprocessing | One persistent `<Canvas>` in the root layout. |
| Motion | lenis (smooth scroll), gsap with ScrollTrigger, framer-motion (UI and route transitions) | All client-side. |
| Content | MDX via next-mdx-remote, JSON, validated with Zod at build time | No CMS. |
| Search | cmdk | Visible "Search" button plus ⌘K. |
| Testing | Vitest, Playwright, Lighthouse CI | Runs on every PR. |
| Analytics | Vercel Analytics and Speed Insights | Cookieless. No banner needed. |
| Hosting | Vercel, personal scope, auto-deploy from `main` | Preview deployments per PR. |

Every dependency is verified on the npm registry before installation (publisher, repository link, download count, age) per security rule 31. Lockfile committed, CI installs frozen.

### Persistent canvas

The WebGL canvas mounts once in `app/layout.tsx` inside a client component and never unmounts during the visit. Pages do not create their own canvases. Instead a page renders a `<View>` (drei) that claims a DOM region, and the scene content for that view is portaled into the single canvas. Route changes are client-side; the canvas keeps rendering across them, so the hero shape can travel from the Home cluster into the project page hero without a reload or flicker.

Scene state (which shape is "active", cluster formation, theme colours) lives in a small Zustand store in `lib/scene-store.ts` so that UI components and 3D components read the same state.

### Rendering and data flow

```
Browser
  │
  ├── Server-rendered HTML (RSC): text, layout, project content from content/
  ├── Client islands: Canvas (lazy), motion wrappers, Search, Terminal
  └── fetch /api/github, /api/leetcode  ──►  Route handlers (Node)
                                                 │  Next data cache, revalidate 3600s
                                                 ├── GitHub GraphQL (token from env)
                                                 └── LeetCode public GraphQL
```

Content is read at build time from `content/` by `lib/content.ts`. Project pages are statically generated. Live-data panels fetch on the client after hydration so that the static HTML is never blocked by a third party.

### Folder structure

```
app/
  layout.tsx            root layout: fonts, theme, nav, persistent CanvasRoot
  page.tsx              Home
  projects/page.tsx     project grid
  projects/[slug]/page.tsx
  lab/page.tsx
  lab/[slug]/page.tsx
  about/page.tsx
  cv/route.ts           redirect to /cv.pdf
  not-found.tsx
  error.tsx
  api/github/route.ts
  api/leetcode/route.ts
  opengraph-image.tsx   default OG image
  sitemap.ts, robots.ts
components/
  ui/                   Button, Card, Tag, ThemeToggle, Nav, Footer, Skeleton
  three/                CanvasRoot, Cluster, Shape, ProjectHeroShape, NotFoundShape, SandboxScene
  motion/               SmoothScroll (Lenis), Reveal, TiltCard, PageTransition
  live/                 ContributionHeatmap, LeetCodeTiles, CurrentlyBuilding
  playground/           Search (cmdk), Terminal, Confetti, Konami
  highlights/           LinkedInEmbed
content/
  projects/*.mdx
  lab/*.mdx
  highlights.json
  profile.json
lib/
  content.ts            loaders + Zod schemas
  schemas.ts
  github.ts, leetcode.ts  upstream fetchers and response trimming
  rate-limit.ts
  device.ts             capability tiering
  scene-store.ts
  terminal/             command parser and command table
public/
  cv.pdf, posters/, projects/, lab/, fonts/
scripts/
  check-secrets.sh
  validate-content.ts
docs/                   Diátaxis documentation set (see section 11)
```

## 4. Pages

### Navigation

Top bar on every page: wordmark (links Home), then Home, Projects, Lab, About, Contact, then a visible **Search** button with a magnifier icon and a theme toggle. On viewports under 768px the links collapse into a full-screen menu behind a large "Menu" button. "Contact" scrolls to or links to the contact footer. Every page ends with the same footer: email button, GitHub, LinkedIn, CV download.

### `/` Home

1. **Hero.** Full viewport. The 3D cluster on the right two thirds (centered on mobile, above the text). Left: name in display type, one-line role ("I build AI systems, agents and playful tools"), two buttons: "See projects" and "Download CV". Under the cluster a hint, "Drag the shapes. Click one to open a project.", that fades after the first interaction and never returns in that session.
2. **What I build.** Three short cards: AI and computer vision, Agents and automation, Security-minded web apps. Each links to the filtered project grid.
3. **Featured projects.** Horizontal strip of the `featured: true` projects, each card coloured with the project colour, tilting toward the cursor.
4. **Right now.** Live panel: GitHub contribution heatmap (12 months), tiles for commits this year, current streak, LeetCode solved by difficulty, and "Currently building" (3 most recently pushed repos with last commit message).
5. **Highlights.** Curated LinkedIn posts from `highlights.json`, embedded lazily, with a "Follow on LinkedIn" link.
6. **Contact footer.**

### `/projects`

Grid of all projects, newest first, featured ones larger. Filter chips by tag (ai, computer-vision, agents, security, data, web). Filters update the URL query so links are shareable. Each card: cover image or colour block, title, tagline, tags, year.

### `/projects/[slug]`

- Hero: the project's 3D shape (travelling from the cluster if the user clicked it, otherwise fading in) on a background flooded with the project colour, title, tagline, links (Repo, Live, Demo) as buttons.
- Body sections in this fixed order, each optional in the MDX: Problem, What I built, How it works, Stack, Outcome, What I learned.
- Sidebar (desktop) or top block (mobile): year, role, stack list, links.
- Bottom: previous and next project cards.
- Generates its own Open Graph image with title and colour.

### `/lab`

Opens with one sentence: "Small experiments and live demos. Click anything to try it." Grid of lab items. Each card: thumbnail, title, one plain-language line, "Try it" button. Launch items:

| Slug | What | Implementation |
| --- | --- | --- |
| `crowd-dashboard` | Crowd monitoring dashboard in demo mode | iframe to the public dashboard deployment using its bundled static data, sandboxed |
| `cluster-sandbox` | The hero shapes with sliders for gravity, bounciness, count | Reuses `Cluster` with controls |
| `shader-toy` | Colourful animated background you can poke | Custom fragment shader, pointer uniform |
| `noah-preview` | Read-only preview of the Noah hub layout | Static screenshots in a device frame, link to repo |

### `/lab/[slug]`

Full-size demo, a plain description, and a "How it works" fold with the technical note.

### `/about`

Short story in first person (4 to 6 paragraphs), a vertical timeline (study, agency work, B.Sc. thesis, now), "Outside work" (HYROX, building agents, languages), CV download button, and the contact footer.

### `/cv`

Route handler returning a 308 redirect to `/cv.pdf`. The PDF is copied from the existing mohammed-cv repo. The old Vercel project gets a redirect to the new domain once the domain exists.

### 404 and error pages

404: a single 3D shape that is broken into pieces. Clicking it reassembles it. Text: "This page wandered off." with buttons Home and Projects. Error page: same layout without 3D, generic message and a request ID.

## 5. Content model

All content lives in `content/` and is validated by Zod schemas in `lib/schemas.ts` at build time. A failing schema fails the build with the file name and field.

### Project frontmatter

```yaml
title: AI-Powered Crowd Detection
slug: crowd-detection
tagline: Privacy-first crowd analytics for a live expo
color: "#FF6B35"
shape: icosahedron        # sphere | box | icosahedron | torusKnot | capsule | octahedron
tags: [ai, computer-vision, privacy]
year: 2026
role: Solo developer, B.Sc. thesis
featured: true
order: 1                  # position in the cluster and featured strip
links:
  repo: https://github.com/...
  live: https://...
  demo: https://...
cover: /projects/crowd-detection/cover.webp
coverAlt: Dashboard showing live occupancy and heatmap
stack: [Python, YOLO, FastAPI, Vanilla JS]
```

Body: Markdown with the section headings listed in 4.3. Images referenced from `public/projects/<slug>/`.

### Lab frontmatter

```yaml
title: Cluster sandbox
slug: cluster-sandbox
description: Play with the shapes from the home page. Change gravity and bounce.
kind: component           # component | iframe
component: SandboxScene   # when kind is component
url: https://...          # when kind is iframe
thumbnail: /lab/cluster-sandbox.webp
thumbnailAlt: ...
order: 1
```

### `highlights.json`

```json
[
  { "url": "https://www.linkedin.com/posts/...", "date": "2026-09-14", "caption": "Shipped the agent security playbook" }
]
```

### `profile.json`

Name, headline, short bio, email, socials (github, linkedin), location, availability line, cluster decoration colours.

### Launch content

Full case studies: `crowd-detection`, `noah-hub`, `agent-security-playbook`, `is-my-app-safe`. Short cards: `unlearned`, `hyrox-tracker`, `bloomline`. Copy is drafted from the repos and existing READMEs, then edited by Mohammed before launch. Nothing from employer or client work is included; only public personal repos.

## 6. The 3D system

> Superseded on 2026-10-31 by section 17 (Pixel storm). Kept for history; where the two differ, section 17 wins.

### Cluster

- 7 to 10 shapes: one per featured project (colour and geometry from frontmatter) plus decorative shapes using colours from `profile.json`.
- Material: matte, slightly rough, candy colours, soft rim light, one key light and one fill light, soft shadows on a transparent ground plane. No HDRI download; lighting is procedural to keep the payload small.
- Physics via Rapier: shapes have mass, drift under a tiny random force, collide with each other and with invisible walls sized to the hero area.

### Interactions

| Trigger | Behaviour |
| --- | --- |
| Pointer move | Shapes receive a repulsive force from the pointer position. On touch devices with motion permission granted, device tilt applies a gravity vector instead. |
| Hover shape | Shape scales to 1.15, its project title appears beside it in display type, other shapes dim to 60% opacity. |
| Click or tap shape | Camera dollies toward the shape, the background floods with the project colour over 500 ms, the router navigates to the project page, and the same shape renders in the project hero. |
| Drag | Pointer drag applies an impulse; release flings the shape. Walls contain it. |
| Scroll on Home | Progress 0 to 1 over the first viewport: walls move outward and shapes scatter to the edges, content underneath becomes visible. Scrolling back regroups them. |
| Idle 20 s | Shapes stack into a tower over 2 s, hold 2 s, then topple. Repeats at most once per minute. |
| Keyboard | Each project shape has a visually hidden focusable twin in the DOM. Focus highlights the shape, Enter opens the project. |

### Device tiers

`lib/device.ts` computes a tier once on the client from: WebGL2 support, `navigator.hardwareConcurrency`, `navigator.deviceMemory`, `prefers-reduced-motion`, `saveData`, and a 1-second frame-time probe after the canvas mounts.

| Tier | Behaviour |
| --- | --- |
| high | Full cluster, postprocessing (subtle bloom and vignette), shadows. |
| mid | No postprocessing, no shadows, 7 shapes. |
| low, reduced motion, save-data, no WebGL | Static WebP poster of the cluster, identical layout, no canvas mounted. |

### Loading and performance

- Static HTML and the poster render first. The 3D chunk is dynamically imported after `requestIdleCallback` or 300 ms, whichever comes first. Shapes fade in over 600 ms, replacing the poster.
- Budgets: first-load JavaScript excluding the 3D chunk under 350 KB gzipped; 3D chunk under 450 KB gzipped; largest contentful paint under 2.5 s on simulated mobile; 60 fps target on iPhone 13.
- The frame loop runs only while the canvas's `View` is in the viewport and the tab is visible (`frameloop="demand"` with invalidation on interaction and physics steps).
- Geometry is generated procedurally. No external model files at launch.

### Motion outside 3D

- Lenis smooth scroll on all pages, disabled under reduced motion.
- Headline reveal: words translate up and fade in on scroll, 40 ms stagger.
- Cards tilt up to 6 degrees toward the pointer with a spring.
- Route transitions: outgoing content fades and slides 16 px, incoming does the reverse; canvas untouched.
- All durations and easings are tokens in `app/globals.css` under `--motion-*`.

## 7. Live data

### `/api/github`

- Server-only fetch to GitHub GraphQL with `GITHUB_TOKEN` (fine-grained, read-only, public repository data only). Queries the contribution calendar for the last 365 days, total contributions, and the 3 most recently pushed public repositories with their latest commit message.
- Response: `{ calendar: [{ date, count, level }], totalThisYear, currentStreak, longestStreak, building: [{ name, url, description, lastCommit, pushedAt }] }`.
- Streaks computed server-side from the calendar.
- Cached with `revalidate: 3600`. Response header `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.

### `/api/leetcode`

- Server-only POST to LeetCode's public GraphQL for the username in `LEETCODE_USERNAME` (non-secret, allowed in env). Fetches solved counts by difficulty and the submission calendar for streak calculation.
- Response: `{ easy, medium, hard, total, currentStreak }`.
- Same caching as GitHub. Marked internally as "best effort": any non-200 or shape mismatch returns `{ available: false }` with status 200 so the client hides the tiles.

### Shared behaviour

- Rate limit: 30 requests per minute per IP using a fixed window keyed on the forwarded IP, implemented in `lib/rate-limit.ts` against Vercel's runtime cache. Over limit returns 429. Fails closed if the store is unavailable.
- Upstream failure: return the last cached payload if present, otherwise `{ available: false }`. Never forward upstream error bodies.
- Payloads are trimmed to the fields above. No raw upstream JSON reaches the client.
- Client panels show skeletons while loading, render data when available, and render a friendly "Activity is napping" card when `available` is false. Layout height is reserved so nothing jumps.
- `highlights.json` entries render through LinkedIn's official post embed inside a sandboxed iframe, loaded only when within 200 px of the viewport.

## 8. Playground

Rule: the normal site is for everyone, the playground is a side door. No public page depends on a shortcut.

### Search

- Visible "Search" button in the nav opens a dialog. ⌘K and Ctrl K also open it. Escape closes.
- Indexes pages, projects, lab items and external links from `profile.json`. Fuzzy matching by cmdk.
- Actions available as results: Toggle theme, Download CV, Copy email, Open GitHub, Open LinkedIn, Shuffle the shapes, Open terminal.
- Fully keyboard operable, focus trapped, announced to screen readers.

### Terminal (hidden)

- Opens from the Search action "Open terminal", by typing `terminal` in Search, or by the Konami code. No link in navigation. Never mentioned on the main path.
- Full-screen overlay. First line: "Type help, or press Escape to leave."
- Commands: `help`, `whoami`, `ls projects`, `open <slug>`, `cat about`, `stack`, `github`, `cv`, `theme dark|light`, `clear`, `exit`, `sudo hire-me`. Unknown commands get a short playful reply. Arrow keys cycle history.
- Runs entirely client-side against the same content loaders. Input is parsed by a strict tokenizer; no `eval`, no dynamic HTML.

### Easter eggs

- Clicking the wordmark 5 times within 3 seconds fires confetti from the cluster.
- 404 shape reassembles on click.
- Console prints a greeting and the repo link once.

## 9. Design system

> Superseded on 2026-10-31 by section 17 (Pixel storm) for fonts, colour defaults and surfaces. Token names and the light/dark mechanism stay.

- Tokens in `app/globals.css`: background, surface, text, muted, border, six accent colours, radii (12, 20, 32 px), spacing scale, motion durations (150, 300, 500, 800 ms) and easings.
- Typography: one display font with strong personality for headlines, one highly legible sans for body, loaded via `next/font` and self-hosted. Final font pair chosen during implementation with a visual check.
- Big type and generous spacing: body 18 px, hero headline clamp 48 to 112 px, section padding 96 px desktop and 64 px mobile.
- Light theme is default under `prefers-color-scheme: light`, dark under dark, with a manual toggle stored in `localStorage` wrapped in try/catch.
- Every project colour is checked for WCAG AA contrast against both themes' text colours in a unit test.
- No em dashes in copy.

## 10. Security

The repo's `CLAUDE.md` contains the full 35-rule drop-in from the agent-security-playbook. Rules that apply to this project and how they are met:

| Rule | How it is met |
| --- | --- |
| 5 Input validation | All route handler inputs (query, headers used) parsed with `z.strictObject`. Content files parsed with Zod at build. |
| 6 Env validation | `lib/env.ts` validates `GITHUB_TOKEN` and `LEETCODE_USERNAME` at boot; missing token fails the build. |
| 7 Output encoding | MDX rendered with HTML disabled. No `dangerouslySetInnerHTML` except the JSON-LD script which is built from a typed object and escaped. External URLs in content pass an `https:` allowlist. |
| 10 Headers | Strict CSP with nonces via middleware, `frame-src` limited to LinkedIn embed and the crowd dashboard origin, `frame-ancestors 'none'`, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying everything except `accelerometer` and `gyroscope` for self. |
| 16 Caching | Public data only; `public, s-maxage` is correct. No personalized responses exist. |
| 19 Rate limiting | Both API routes, keyed on IP, failing closed. |
| 20 SSRF | Upstream URLs are constants. No user-supplied URL is ever fetched. |
| 29 Errors | Clients get generic messages plus request ID. Logs are structured, no secrets, no PII. |
| 30 Secrets | `GITHUB_TOKEN` server-only, never `NEXT_PUBLIC_`. gitleaks in pre-commit and CI plus `scripts/check-secrets.sh` grep for live prefixes, home paths, email and employer name. |
| 31 Supply chain | Each dependency verified before install, lockfile committed, `npm ci` in CI, Dependabot enabled. |
| 33 Deployment | Preview deployments protected by Vercel authentication; production unprotected by design. |
| 35 Negative tests | Playwright table: both API routes return 429 over limit, return `{available:false}` on upstream failure, CSP header present on every page. |

Not applicable at launch: auth, RLS, uploads, payments, webhooks, email, realtime, AI agents. The `docs/security.md` page records this scoping so a future feature re-checks it.

## 11. Documentation

Follows the documentation playbook (Diátaxis, code-grounded, verified). Page set at launch:

- `docs/README.md` index.
- Tutorial: `docs/tutorials/add-a-project.md` (end to end: write the MDX, add images, run validation, preview).
- How-to: `run-locally.md`, `deploy.md`, `add-a-lab-item.md`, `add-a-highlight.md`, `rotate-the-github-token.md`.
- Reference: `content-schema.md`, `api.md`, `configuration.md`, `project-structure.md`, `design-tokens.md`.
- Explanation: `architecture.md` (persistent canvas, data flow, Mermaid diagrams), `performance-budget.md`, `security.md`.

Each page is written from the code with `file:line` citations and verified in an adversarial pass before the launch PR merges. The root `README.md` carries a banner, badges, a short pitch, a screenshot and links into `docs/`.

## 12. Testing and quality

| Layer | Tool | Scope |
| --- | --- | --- |
| Content | Zod via `scripts/validate-content.ts` | Every MDX and JSON file, run in `prebuild` and CI. |
| Unit | Vitest | content loaders, schemas, device tiering, GitHub and LeetCode parsers and streak math, rate limiter, terminal parser, colour contrast of project colours. |
| End to end | Playwright, Chromium and WebKit, desktop and mobile viewports | Home renders, nav and mobile menu work, project opens from grid, Search finds a project, reduced motion disables the canvas, API routes return valid JSON, security negative tests. |
| Visual | Playwright screenshots | Home, one project, Lab, in light and dark, against committed baselines with a 0.2% threshold. |
| Performance | Lighthouse CI | Budgets from section 6 on Home, a project page and Lab. Failing budget fails the PR. |
| Accessibility | axe via Playwright | Zero serious or critical violations on every public page. |

CI runs on every pull request: lint, typecheck, secrets scan, unit, build, e2e, Lighthouse. `main` is protected and requires CI green.

## 13. Error handling summary

- 3D: error boundary around `CanvasRoot`. Any thrown error unmounts the canvas and shows the poster. Logged once.
- Live data: handled in section 7. Page never errors because of a third party.
- Content: build fails on invalid content with a clear message.
- Runtime: `app/error.tsx` and `app/not-found.tsx` on brand. Server errors return a request ID.

## 14. Launch checklist

- Open Graph images per project and a default one, verified in LinkedIn and iMessage previews.
- `sitemap.xml`, `robots.txt`, canonical URLs, JSON-LD Person schema.
- `security.txt` from the playbook template.
- Vercel Analytics and Speed Insights enabled.
- Domain: Mohammed buys a `.ai` domain; prices are checked against `.dev` and `.com` before purchase. Until then the site runs on the Vercel URL. The mohammed-cv project redirects to the new site after launch.
- Final copy pass by Mohammed on all project pages and the About page.

## 15. Working agreements

- One small commit per unit of work. Branch per feature, pull request per feature, self-review on each PR from Mohammed's account, merge without squashing so the commit history stays granular.
- No co-author trailers or generator footers on commits or PRs.
- `scripts/check-secrets.sh` runs before every push and in CI.
- Conventional commit prefixes: `feat`, `fix`, `docs`, `test`, `chore`, `perf`, `refactor`, `style`, `ci`.

## 16. Open items for Mohammed

- Provide a LinkedIn profile URL and 3 to 6 post URLs for the Highlights section.
- Confirm the LeetCode username.
- Choose the final domain.
- Review and edit drafted copy before launch.

## 17. Visual direction v2: Pixel storm (added 2026-10-31)

> Superseded on 2026-10-31 by section 18 (Monolith). The storm mechanics (GPU points, pointer wind, tiers, fallbacks) are kept and re-skinned; the rainbow name, candy accents and playful tone are dropped.

Mohammed reviewed the shipped foundation and rejected its look: generic layout, stock-looking fonts, no 3D, no motion. This section replaces sections 6 and 9 for everything visible. Content model, navigation labels, security, CI and docs from the foundation stay.

### 17.1 Hero

- A GPU points layer renders roughly 40,000 coloured pixels that form the word MOHAMMED in the display face, with slight depth so it reads as a cloud. Colours cycle through the six accents by column.
- Pointer movement applies a wind force within a radius of about 140 px (screen space); pixels drift away and spring back (damped spring, stiffness tuned so settle time is under 1.2 s). On touch devices with motion permission, device tilt supplies the force; otherwise a slow autonomous breeze.
- Every 8 seconds, or when the user scrolls past 20% of the hero, the cloud collapses and re-forms as the silhouette of one featured project's shape (sampled from the same geometry used in cards), which rotates slowly in 3D. The project title appears beside it in the pixel font with a typewriter effect. Clicking or pressing Enter on the shape navigates to the project. Keyboard users get a visually hidden list of the featured projects over the hero.
- Hint under the hero, pixel font, caps: `MOVE YOUR MOUSE. CLICK A SHAPE.` Fades after first interaction, per session.
- Fallbacks: `prefers-reduced-motion`, save-data, low tier or no WebGL2 show a static pre-rendered WebP of the pixel name (`public/posters/pixel-name.webp`) in the same slot. Any WebGL error falls back the same way.

### 17.2 Type

- Display: Unbounded (SIL OFL, Google Fonts via next/font/google, self-hosted at build), weights 600 and 700, used for the name, section titles and project titles. Tight tracking (-0.03em), tight leading (0.9). Clash Display was the first pick; dropped because the Fontshare licence forbids redistributing its files through a public repository.
- Pixel: Silkscreen (Google Fonts via next/font/google) in caps for tags, year, nav labels, hints and the marquee's separators. Never for paragraphs.
- Body: Manrope (SIL OFL, Google Fonts) 400 and 500, 18 px base.
- Kinetic marquee strip between Home sections: `AI · AGENTS · COMPUTER VISION · SECURITY · PLAYFUL TOOLS` in display type at about 96 px, scrolling continuously, direction follows scroll direction, speed eases with scroll velocity. Paused under reduced motion.

### 17.3 Motion

- Page transitions: pixel dissolve. A fixed overlay grid of 24 by 14 blocks in the accent colours flips in a diagonal wave covering the outgoing page (250 ms), the route changes, then the wave uncovers the incoming page (250 ms). The persistent canvas is not covered. Reduced motion: a 150 ms fade.
- Section reveals: headings assemble from scattered glyph fragments over 500 ms when 30% visible; cards slide up 24 px with a slight overshoot; stagger 60 ms.
- Custom cursor on pointer devices: an 8 px square in the current accent that follows with a 60 ms lag, a trail of 6 fading squares, grows to a 40 px ring over links, buttons and shapes, hidden on touch, hidden under reduced motion, and the native cursor returns over text inputs.
- Project card hover: the cover image pixelates in 4 steps (16 px blocks down to 2 px) while the card's shape spins up.
- Smooth scroll via Lenis, disabled under reduced motion.

### 17.4 3D

- Shapes: six low-poly geometries (sphere, box, icosahedron, torus knot, capsule, octahedron) in a dithered toon shader (ordered 4x4 Bayer dither, two-tone from the project colour, 1 px dark outline). One shared material per colour.
- Cards: each project card carries a small spinning shape (continuous 0.25 rad/s, 4x on hover), rendered through a drei `View` into the single persistent canvas.
- Project page hero: the shape at about 320 px, spinning, with a drifting pixel cloud in the project colour behind the title (3,000 pixels, breeze only).
- 404: the shape shattered into about 800 pixels; clicking reassembles it over 900 ms.
- Lab sandbox `/lab/pixel-storm`: the hero storm with sliders for wind radius, spring stiffness, pixel count (10k to 80k) and a shape picker.
- One `<Canvas>` in the root layout, `frameloop="demand"` with invalidation from interaction and animation, paused when the tab is hidden. No physics engine: springs and wind run in the vertex shader from uniforms. No model files.

### 17.5 Colour and surface

- Dark is the default theme: bg `#0B0B10`, surface `#141420`, text `#F6F3EE`, muted `#A39FAD`, border `#2A2833`. Light stays available via the toggle: bg `#FFFBF5`, surface `#FFFFFF`, text `#17161A`, muted `#5F5B66`, border `#EAE4DA`. The six accents are unchanged.
- Film grain: a fixed, pointer-events-none SVG turbulence overlay at 6% opacity (4% in light), disabled under reduced motion is not needed since it is static.
- Cards use a 2 px solid border in the project colour and no shadow. Buttons use 2 px borders, hard corners (radius 4 px) and a 2 px offset "pixel shadow" in the accent on hover.
- Focus rings: 2 px solid accent 4 with 2 px offset, everywhere.

### 17.6 Still simple, still fast

- Navigation, page set, copy rules and the "playground is a side door" principle from sections 4 and 8 are unchanged. Every page is reachable and readable without 3D or pointer effects.
- Budgets: first-load JavaScript excluding the 3D chunk under 350 KB gzipped (enforced), 3D plus pixel chunk under 450 KB gzipped (enforced), LCP under 2.5 s on mobile (returns to a hard error in Lighthouse CI when this plan ships), 60 fps on an iPhone 13 class device for the hero, Lighthouse performance 85 or higher.
- Device tiers from section 6 stay: high (full), mid (20k pixels, no grain, no cursor trail), low (static posters, no canvas).
- All tests from section 12 apply; add: reduced-motion e2e proves no canvas is mounted and transitions are fades; a unit test that the pixel sampler produces a stable point count for the name; a visual baseline of the hero in both themes.

## 18. Visual direction v3: Monolith (added 2026-10-31)

Mohammed reviewed the pixel storm and rejected it: too colourful, a rainbow of his own name, not abstract, not "cyber". This section replaces section 17 for everything visible and section 4's top navigation. Content model, security, CI, docs, budgets and fallback rules stay. The persistent canvas, GPU points, pointer-wind physics, device tiers and posters from plan 2 are reused.

### 18.1 Mood

Dark, monochrome, abstract, technical. Black, greys and white only. Light comes from white glow, scanlines and grain, never from colour. Motion is constant but precise: decode, glitch, slice, orbit. Nothing bounces, nothing is cute.

### 18.2 Colour and surface

- Tokens: bg `#050505`, surface `#0F0F11`, surface-2 `#17171A`, border `#2A2A2E`, muted `#6B6B70`, text `#F2F2F0`, glow `#FFFFFF`. The six accents are removed from the UI; `--accent-*` tokens remain only for the Lab sandbox and are not used by any page.
- Light theme is retired. The theme toggle is removed. `color-scheme: dark` everywhere.
- Overlays: CRT scanlines (2 px period, 6% opacity), film grain (5%), vignette (radial, 35% at the edges). All static, pointer-events none, hidden on mid tier except the vignette.
- A perspective grid floor (1 px lines, 10% white) behind the hero and the Work page, drifting slowly and parallaxing with scroll. Static image under reduced motion and low tier.
- Surfaces use 1 px borders in `border`, corner brackets (8 px, 1 px, white) that extend to 16 px on hover, no radius, no shadow.

### 18.3 Layout: side tabs

- Desktop (≥ 1024 px): a fixed vertical rail on the left, 72 px wide, black with a 1 px right border. Five tabs stacked: HOME, WORK, LAB, ABOUT, CONTACT, each an icon (16 px, 1 px stroke, monochrome) with the label in mono caps rotated 90° or shown on hover when the rail expands to 220 px. The active tab has a 2 px white bar on the left edge and white text; inactive are `muted`. Bottom of the rail: a small coordinate readout `LAT/LNG`-style scroll position `00.00` in mono and the theme-free wordmark `MA`. Content area starts at 72 px.
- Mobile (< 1024 px): a fixed bottom bar with the five tabs (icon over 10 px mono label), 56 px tall, safe-area aware. No hamburger menu.
- Labels are plain words. Every page is reachable in one tap. Keyboard: tabs are links with `aria-current`.
- Routes unchanged: `/`, `/projects` (shown as WORK), `/lab`, `/about`, `/#contact` becomes a real `/contact` page with the email and socials, so the rail has five real destinations.

### 18.4 Hero: the figure

- A point-cloud bust of Mohammed built from a single photo (bust, front-facing). Pipeline: person segmentation (Apple Vision, run locally once), silhouette inflated into a volume by a distance-to-edge profile, interior filled sparsely, luminance from the photo mapped to grey levels; roughly 50,000 to 60,000 points. The photo is never committed; the derived points are committed as a quantised binary (`public/figure/bust.bin`, 4 bytes per point: x, y, z, luminance as uint8) under 250 KB plus a static poster (`public/posters/figure.webp`).
- The figure rotates continuously around its vertical axis at 0.15 rad/s. Because the volume is inflated from one photo, back-facing points fade to 25% brightness and the side view is accepted as an abstract lens; a full rotation reads as a hologram, not a scan.
- Shader: square points, size from luminance (brighter = larger, 1.5 to 3.5 px), white-to-grey, additive-free normal blending on black, a horizontal scanline sweep (one bright band per 4 s), a glitch slice every 6 to 10 s (three horizontal bands offset by up to 24 px for 120 ms), depth fog (points further back fade). Pointer wind from plan 2 Task 4 applies in the camera plane; the figure reforms within 1.2 s.
- Scroll on Home orbits the camera 30° around the figure over the first viewport and pulls back; the rail readout counts the scroll.
- Beside or below the figure: `MOHAMMED AL-ALIMI` in mono caps decoding from random glyphs over 900 ms on load, the headline in display type, two bracketed buttons (`VIEW WORK`, `DOWNLOAD CV`). Hint in mono caps: `MOVE TO DISTURB.` fades after first interaction.
- Fallbacks: reduced motion, low tier, no WebGL or any scene error show `figure.webp` in the same slot; the decode becomes a plain fade.

### 18.5 Type

- Display: Syne 800 (SIL OFL, Google Fonts via next/font/google) for page titles, project titles and the headline. Tight tracking (-0.02em), leading 0.9.
- Mono: JetBrains Mono 400/700 (SIL OFL) for everything else: body, labels, nav, buttons, meta, code. Labels in caps with 0.12em tracking. Body 16 px mono at 1.6 line height (readability over size; mono needs it).
- Silkscreen, Unbounded and Manrope are removed.
- Text decode: headings decode from random glyphs when they enter the viewport (glyph pool `█▓▒░<>/\|_-=+*#01`), 24 ms per character, max 900 ms. Under reduced motion: no decode.

### 18.6 Motion

- Page transitions: glitch wipe. The outgoing page is sliced into 12 horizontal bands that shear left or right by 8 to 40 px and fade over 200 ms; the incoming page assembles in reverse over 200 ms. Reduced motion: 150 ms fade.
- Cursor (pointer devices, high tier): a 1 px crosshair (two 12 px lines) with a 3 px square centre and a mono readout of the pointer coordinates in the bottom-right of the rail; over links and buttons the crosshair snaps to the element's corners as brackets. Hidden on touch and under reduced motion.
- Cards: covers are rendered monochrome with a halftone dither (CSS filter plus an SVG feTurbulence displacement is not enough; use a small canvas or a WebGL View with a Bayer dither shader on the image) and resolve to the clean greyscale image on hover over 240 ms. Corner brackets extend; an index `01 / 07` in mono.
- Numbers (year, counts) count up when entering view. A mono ticker strip between Home sections scrolls `AI · AGENTS · COMPUTER VISION · SECURITY · SYSTEMS` with a scanline.
- Smooth scroll via Lenis; the grid floor and figure orbit are scroll-driven.
- 404: the figure dissolved into static noise; clicking reassembles it.

### 18.7 Still simple, still fast

- Side tabs are the only navigation; labels are plain words; every page works without pointer effects or WebGL.
- Budgets unchanged (first-load under 350 KB gzipped excluding 3D, 3D plus figure code under 450 KB, figure data under 250 KB fetched lazily, LCP under 2.5 s, performance 85 or higher, 60 fps on an iPhone 13 for the figure at 30,000 points on mid tier).
- Tiers: high (full), mid (30k points, no scanlines/grain, no cursor), low (posters, no canvas).
- Tests as in section 12 plus: decode and glitch respect reduced motion; the rail and bottom bar are keyboard operable with `aria-current`; the figure poster is the LCP element; visual baselines of the hero and a project page.

