# Pixel Storm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every visible surface of the foundation with the Pixel storm direction: a GPU pixel hero that forms the name and morphs into spinning project shapes, distinctive type, pixel-dissolve transitions, a custom cursor, dithered 3D shapes on cards and project pages, a kinetic marquee, dark-first colour, all with fallbacks and budgets.

**Architecture:** One persistent `<Canvas>` (React Three Fiber) mounted in the root layout; pages claim regions with drei `View`. The pixel storm is a single `Points` with custom GLSL: target positions, spring and wind computed in the vertex shader from uniforms, so there is no physics engine. Shapes share one dithered toon `ShaderMaterial` per colour. Motion outside WebGL uses Lenis, GSAP ScrollTrigger and `motion`. A `TransitionProvider` wraps navigation for the pixel dissolve. Device tiering and reduced motion gate everything.

**Tech Stack:** three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7, zustand 5, gsap 3.15, lenis 1.3, motion 14.9, next/font/local (Clash Display, Satoshi from Fontshare), next/font/google (Silkscreen).

**Spec:** `docs/superpowers/specs/2026-10-31-portfolio-design.md`, section 17 (supersedes 6 and 9). Sections 4, 8, 10, 12 still bind.

## Global Constraints

- Every rule from the foundation plan's Global Constraints still applies (branch per task, PR per task, self-review, no attribution trailers, exact-pinned verified dependencies, secrets scan, copy rules, 44 px targets, axe zero serious/critical, no horizontal scroll at 320 px).
- Exactly one `<Canvas>` in the app, mounted in `app/layout.tsx` via `CanvasRoot`. Pages never create a canvas; they render `View`s.
- All WebGL code lives under `components/three/` and is imported only through `next/dynamic` with `ssr: false`. Static HTML and posters must render with JavaScript disabled.
- Fallback order for every effect: reduced motion → static; save-data or low tier → static; WebGL error → static. Mid tier: 20k pixels, no grain, no cursor trail.
- Budgets (enforced in Task 12): first-load JS excluding the 3D chunk under 350 KB gzipped; 3D plus pixel chunk under 450 KB gzipped; LCP under 2.5 s mobile as a hard Lighthouse error; performance 85 or higher.
- Fonts: Clash Display 600/700 (`--font-display`), Satoshi 400/500 (`--font-sans`), Silkscreen 400 (`--font-pixel`). Inter and Bricolage Grotesque are removed.
- Dark is the default theme. Colours: dark bg `#0B0B10`, surface `#141420`, text `#F6F3EE`, muted `#A39FAD`, border `#2A2833`; light unchanged; accents unchanged.
- Pixel font only for tags, year, nav labels, hints, marquee separators, never paragraphs.
- Timings from spec 17: wind radius 140 px, settle under 1.2 s, morph every 8 s, transition 250 ms + 250 ms, cursor lag 60 ms, card spin 0.25 rad/s (4x on hover).

## Review Focus

1. A visitor with `prefers-reduced-motion: reduce` must see the static pixel-name poster, no canvas element, fade transitions, no marquee movement, no custom cursor. Pinned in Task 2 and Task 12 e2e.
2. A visitor on a device without WebGL2 must get the same static experience with no console errors. Pinned in Task 2 unit (tier) and e2e (WebGL disabled via launch flag).
3. Keyboard users must be able to open each featured project from the hero without a pointer. Pinned in Task 5 e2e.
4. Navigating during a transition (double click) must not strand the overlay covering the page. Pinned in Task 8 e2e.
5. A project with `cover` missing must still show a spinning shape and no broken image. Pinned in Task 6 e2e with a temporary fixture project.

---

### Task 1: Type system and dark-first tokens

**Files:**
- Create: `public/fonts/ClashDisplay-Semibold.woff2`, `public/fonts/ClashDisplay-Bold.woff2`, `public/fonts/Satoshi-Regular.woff2`, `public/fonts/Satoshi-Medium.woff2`, `public/fonts/LICENSE-fontshare.txt`, `components/ui/Grain.tsx`, `tests/unit/fonts.test.ts`
- Modify: `lib/fonts.ts`, `app/globals.css`, `app/layout.tsx`, `components/ui/ThemeProvider.tsx` (default theme dark), `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/Tag.tsx`, `components/ui/Nav.tsx`, `components/ui/NavLinks.tsx`, `components/ui/Footer.tsx`, `docs/reference/design-tokens.md`

**Interfaces:**
- Produces: `display`, `sans`, `pixel` exports from `lib/fonts.ts` with variables `--font-display-src`, `--font-sans-src`, `--font-pixel-src`; Tailwind names `font-display`, `font-sans`, `font-pixel`; CSS variables unchanged in name, new dark defaults; `Grain()` fixed overlay honouring tier via a `data-grain` attribute toggled by Task 2.

- [ ] **Step 1: Fonts.** Download Clash Display (Semibold, Bold) and Satoshi (Regular, Medium) woff2 from Fontshare (free licence, self-hosting allowed), keep the licence file. `lib/fonts.ts` uses `next/font/local` for both and `next/font/google` `Silkscreen` for pixel. Unit test: the three exports have `variable` names ending in `-src`.
- [ ] **Step 2: Tokens.** `globals.css`: dark values become `:root` defaults, light values move under `.light`; `ThemeProvider` `defaultTheme="dark"` with `enableSystem={false}` and `attribute="class"` writing `light`/`dark`; keep `@custom-variant dark`. Add `--radius-sm: 4px` (hard corners), keep md/lg for cards at 8 px and 12 px. Add `--font-pixel` mapping.
- [ ] **Step 3: Surfaces.** Buttons: 2 px border, radius 4, hover pixel shadow `box-shadow: 2px 2px 0 var(--accent-4)`. Cards: 2 px border in the colour, no shadow. Tags, nav labels, year: `font-pixel uppercase tracking-wider text-[11px]`. Focus ring unified to `outline-2 outline-offset-2 outline-[var(--accent-4)]`.
- [ ] **Step 4: Grain.** `Grain.tsx`: `position: fixed; inset: 0; pointer-events: none; z-index: 60` SVG `feTurbulence` at 6% opacity (4% in light). Mount in layout after children.
- [ ] **Step 5: Verify.** Full e2e green (colour contrast in dark default via a11y sweep), screenshots of `/` and `/projects/crowd-detection` in both themes to the SDD workspace. Update `design-tokens.md`.
- [ ] **Step 6: Commits.** `feat: add clash display, satoshi and silkscreen fonts`, `feat: make dark the default theme`, `feat: hard borders, pixel shadows and pixel labels`, `feat: add film grain overlay`, `docs: update design tokens for pixel storm`.

---

### Task 2: Persistent canvas, device tiers and fallbacks

**Files:**
- Create: `components/three/CanvasRoot.tsx`, `components/three/SceneErrorBoundary.tsx`, `components/three/ViewSlot.tsx`, `lib/device.ts`, `lib/scene-store.ts`, `tests/unit/device.test.ts`, `tests/e2e/fallbacks.spec.ts`
- Modify: `app/layout.tsx`, `package.json`

**Interfaces:**
- Produces: `getDeviceTier(): "high" | "mid" | "low"` (pure, inputs injectable for tests: `{ reducedMotion, saveData, webgl2, cores, memory, frameMs }`); `useTier()` client hook (computes once, stores in `scene-store`); `CanvasRoot` (client, `next/dynamic` `ssr:false`) mounting one `<Canvas frameloop="demand" dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: "high-performance" }}>` with `<View.Port />`, only when tier is not low; `ViewSlot({ children, className, poster })` renders a `<div>` that becomes a drei `View` track and shows `poster` (a React node) until the scene signals ready via `scene-store.ready`; `SceneErrorBoundary` swaps to the poster on any error and sets `scene-store.failed = true`.
- `lib/scene-store.ts` (zustand): `{ tier, ready, failed, activeShape: string | null, pointer: { x, y, vx, vy }, reducedMotion }`.

- [ ] **Step 1: Deps.** Verify and install exact-pinned `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `@types/three`.
- [ ] **Step 2: Tier unit tests.** `reducedMotion` → low; `!webgl2` → low; `saveData` → low; `cores<=4 && memory<=4` → mid; `frameMs>20` → mid; else high. Implement.
- [ ] **Step 3: CanvasRoot + layout.** Mount `<CanvasRoot />` before `{children}` in layout (fixed, inset 0, `z-index: -1`, `pointer-events: none`; Views enable events per slot). `data-tier` on `<html>` set by `useTier`.
- [ ] **Step 4: Fallback e2e.** `fallbacks.spec.ts`: with `emulateMedia({ reducedMotion: "reduce" })` → `page.locator("canvas")` count 0 and `html[data-tier="low"]`; with Chromium launched `--disable-webgl` (a dedicated Playwright project `chromium-nowebgl`) → no canvas, no console errors; default → exactly one canvas.
- [ ] **Step 5: CSP.** No change needed (no wasm). Confirm `worker-src 'self' blob:` remains. Run security e2e.
- [ ] **Step 6: Commits.** `chore: add three, fiber, drei and zustand`, `feat: add device tiering`, `test: add device tier tests`, `feat: mount one persistent canvas with error boundary`, `test: add fallback e2e for reduced motion and no webgl`.

---

### Task 3: Pixel sampler and static storm

**Files:**
- Create: `lib/pixel-sampler.ts`, `components/three/PixelStorm.tsx`, `components/three/shaders/storm.vert.glsl`, `components/three/shaders/storm.frag.glsl`, `scripts/make-pixel-poster.mjs`, `public/posters/pixel-name.webp`, `tests/unit/pixel-sampler.test.ts`
- Modify: `components/home/Hero.tsx`, `components/home/HeroPoster.tsx`

**Interfaces:**
- Produces: `sampleText(text: string, opts: { font: string; width: number; height: number; step: number }): Float32Array` (xy pairs, normalised -1..1, deterministic; runs in a worker-free offscreen canvas on the client and in Node via `@napi-rs/canvas`? No: in tests use a tiny fake canvas; the function takes a `getContext` factory so tests inject a stub that returns a known bitmap); `PixelStorm({ count, targets: Float32Array, colors: string[] })` rendering `<points>` with `BufferGeometry` attributes `aTarget`, `aSeed`, `aColor` and uniforms `uTime`, `uPointer`, `uPointerVel`, `uRadius=140`, `uStiffness`, `uDamping`, `uMorph`; vertex shader computes `pos = target + windOffset(seed, pointer)` with spring settle; fragment draws square points with the colour and 1 px dark rim.
- Hero renders `<ViewSlot poster={<HeroPoster src="/posters/pixel-name.webp" />}>` containing `PixelStorm` fed by `sampleText("MOHAMMED", displayFont)` at `count` from tier (high 40k, mid 20k).

- [ ] **Step 1: Sampler test.** Stub bitmap 8x4 with a known pattern → expected point list; step respects spacing; output length even; same input → same output.
- [ ] **Step 2: Implement sampler and shaders.** Points as `gl_PointSize` scaled by dpr, depth jitter ±0.05 from seed.
- [ ] **Step 3: Poster.** `make-pixel-poster.mjs` renders the same sampling to a 1600x900 WebP (pixel squares in accent colours on transparent) under 120 KB; commit.
- [ ] **Step 4: Hero integration.** Replace the cluster poster; keep h1 text for SEO (visually hidden over the storm, `sr-only`), buttons unchanged; hint in pixel font.
- [ ] **Step 5: E2E.** Home still renders h1 text and buttons; canvas present on default; poster image present under reduced motion; axe green.
- [ ] **Step 6: Commits.** `feat: add deterministic pixel text sampler`, `test: add pixel sampler tests`, `feat: add pixel storm points with spring shader`, `feat: render the pixel name poster`, `feat: put the pixel storm in the hero`.

---

### Task 4: Wind, tilt and autonomous breeze

**Files:**
- Create: `components/three/usePointerForce.ts`, `components/three/useTiltForce.ts`, `tests/unit/pointer-force.test.ts`
- Modify: `components/three/PixelStorm.tsx`, `components/home/Hero.tsx`

**Interfaces:**
- Produces: `usePointerForce(slotRef)` writing `pointer` and velocity into `scene-store` (normalised to the slot, with 60 ms smoothing), `useTiltForce()` using `DeviceOrientationEvent` after an explicit permission tap on iOS (a small `Enable tilt` pixel-font button appears only on touch devices that require permission), breeze: when no input for 2 s, a slow Perlin-like drift from `uTime`.

- [ ] **Step 1: Unit test** the smoothing and normalisation (pure helper `smoothPointer(prev, next, dt)`), and the breeze amplitude function.
- [ ] **Step 2: Implement** and wire uniforms; invalidate the frame loop on pointer move; stop invalidating when settled (velocity under threshold) to honour `frameloop="demand"`.
- [ ] **Step 3: Hint** fade on first pointer/touch/tilt event (sessionStorage flag in try/catch).
- [ ] **Step 4: E2E** on chromium-desktop: move the mouse across the hero and assert the frame loop ran (expose `window.__stormFrames` counter in dev/test builds only, behind `process.env.NEXT_PUBLIC_E2E === "1"`); hint disappears after a move.
- [ ] **Step 5: Commits.** `feat: push pixels with pointer wind`, `test: add pointer smoothing tests`, `feat: tilt force on touch devices`, `feat: breeze when idle and settle detection`, `feat: hide the hero hint after first interaction`.

---

### Task 5: Morph into project shapes, cycle and click

**Files:**
- Create: `lib/shape-points.ts`, `components/three/ShapeGeometry.ts`, `components/three/HeroShapeCycle.tsx`, `components/home/HeroProjectList.tsx`, `tests/unit/shape-points.test.ts`, `tests/e2e/hero.spec.ts`
- Modify: `components/three/PixelStorm.tsx` (second target attribute `aTarget2` + `uMorph` 0..1), `components/home/Hero.tsx`

**Interfaces:**
- Produces: `shapeGeometry(name: ShapeName): BufferGeometry` (low-poly: sphere 24x16, box 2 segments, icosahedron detail 1, torus knot 64x12, capsule 12x8, octahedron detail 1); `sampleShapeSurface(geometry, count, seed): Float32Array` (xyz per point, deterministic); `HeroShapeCycle({ projects: FeaturedProject[] })` which every 8 s (or on scroll past 20%) sets `uMorph` to 1 towards the next shape's points rotated by `uTime`, shows the title in pixel font with a typewriter (30 ms/char), and on click/Enter navigates with `router.push(`/projects/${slug}`)`; `HeroProjectList` is a visually hidden `<ul>` of the featured projects with real links, placed before the storm, so keyboard and screen reader users have a direct path.

- [ ] **Step 1: Unit tests**: `sampleShapeSurface` returns `count*3` floats, deterministic by seed, all points within the geometry's bounding sphere.
- [ ] **Step 2: Implement** morph (lerp with ease in shader), rotation of target set on CPU each frame only while morphing or spinning (invalidate), colour shift to the project colour.
- [ ] **Step 3: E2E `hero.spec.ts`**: after 8.5 s a shape title in pixel font is visible; clicking the storm slot's active area navigates to that project; Tab reaches the hidden list links and Enter opens a project (Review Focus 3).
- [ ] **Step 4: Commits.** `feat: add low-poly shape geometries and surface sampler`, `test: add shape sampler tests`, `feat: morph the storm into project shapes on a cycle`, `feat: click or press enter on the hero shape to open the project`, `test: add hero cycle and keyboard e2e`.

---

### Task 6: Dithered shapes on cards, project hero and 404

**Files:**
- Create: `components/three/DitherMaterial.ts`, `components/three/shaders/dither.vert.glsl`, `components/three/shaders/dither.frag.glsl`, `components/three/SpinningShape.tsx`, `components/three/ShatteredShape.tsx`, `components/three/ProjectCloud.tsx`, `tests/unit/dither-material.test.ts`
- Modify: `components/projects/ProjectCard.tsx`, `components/projects/ProjectHero.tsx`, `app/not-found.tsx`, `components/ui/Card.tsx`

**Interfaces:**
- Produces: `ditherMaterial(color: string): ShaderMaterial` (cached per colour; 4x4 Bayer, two tones from the colour at 0.55 and 1.0 luminance, 1 px outline via back-face expansion); `SpinningShape({ shape, color, size, speed = 0.25, hoverBoost = 4 })` in a `ViewSlot` with a static SVG poster of the shape outline; `ShatteredShape({ shape, color })` 800 pixels that reassemble on click (900 ms); `ProjectCloud({ color, count = 3000 })` breeze-only pixels.
- ProjectCard: shape in the top-right corner of the cover area, 96 px; when `cover` is missing, the shape is centred at 200 px on a colour block (Review Focus 5). Hover sets a `hover` flag in the store keyed by slug; the shape reads it.

- [ ] **Step 1: Unit test**: `ditherMaterial` returns the same instance for the same colour; uniforms contain `uColorA`/`uColorB` derived from the input.
- [ ] **Step 2: Implement** material, SpinningShape, ProjectCloud, ShatteredShape; wire into card, hero, 404.
- [ ] **Step 3: E2E**: project page shows one canvas (shared) and the title; 404 click reassembles (assert a `data-state="whole"` attribute after 1 s); a temporary fixture project without `cover` (added under `tests/fixtures` and loaded via `CONTENT_DIR` env in the e2e webServer? No: simpler, temporarily remove `cover` from one real project in a test-only copy is not possible; instead unit-test the no-cover branch of `ProjectCard` with Testing Library asserting the colour block and shape poster render).
- [ ] **Step 4: Commits.** `feat: add dithered toon material`, `test: add dither material tests`, `feat: spinning shapes on project cards`, `feat: project page hero shape and pixel cloud`, `feat: shattered shape on the 404 page`, `test: cover no-cover card and 404 reassembly`.

---

### Task 7: Motion layer: Lenis, reveals, marquee, card overshoot

**Files:**
- Create: `components/motion/SmoothScroll.tsx`, `components/motion/Reveal.tsx`, `components/motion/AssembleHeading.tsx`, `components/motion/Marquee.tsx`, `lib/motion.ts`, `tests/unit/motion.test.ts`, `tests/e2e/motion.spec.ts`
- Modify: `app/layout.tsx`, `app/page.tsx`, `components/ui/Section.tsx`, `components/projects/ProjectGrid.tsx`

**Interfaces:**
- Produces: `SmoothScroll` (Lenis, disabled under reduced motion, exposes `lenis` to GSAP ticker); `Reveal({ children, delay })` slide-up 24 px with overshoot (`motion`), triggered at 30% visibility, once; `AssembleHeading({ as, children })` splits text into glyph spans and animates them from scattered offsets over 500 ms; `Marquee({ items })` display type at `clamp(48px, 8vw, 96px)` with pixel-font separators, direction follows scroll direction, speed eased by velocity, paused under reduced motion; `lib/motion.ts` exports `MOTION = { fast: 150, base: 300, slow: 500, xslow: 800, easeOut: [0.22, 1, 0.36, 1] }` (unit-tested to match the CSS tokens by reading `globals.css` in the test).

- [ ] **Step 1: Deps.** Verify, install exact-pinned `lenis`, `gsap`, `motion`.
- [ ] **Step 2: Unit test** `MOTION` matches tokens; `marqueeSpeed(velocity)` clamps.
- [ ] **Step 3: Implement** and apply: Section titles use `AssembleHeading`; grid cards wrapped in `Reveal` with 60 ms stagger; Home gets the marquee between "What I build" and "Featured projects".
- [ ] **Step 4: E2E**: under reduced motion the marquee `transform` is static across 500 ms and headings are visible immediately; default: a heading below the fold becomes visible after scroll.
- [ ] **Step 5: Commits.** `chore: add lenis, gsap and motion`, `feat: smooth scroll`, `feat: assembling headings and card reveals`, `feat: kinetic marquee strip`, `test: motion and reduced motion e2e`.

---

### Task 8: Pixel-dissolve page transitions

**Files:**
- Create: `components/motion/TransitionProvider.tsx`, `components/motion/PixelOverlay.tsx`, `components/motion/TransitionLink.tsx`, `tests/e2e/transitions.spec.ts`
- Modify: `app/layout.tsx`, `components/ui/Button.tsx` (internal links use `TransitionLink`), `components/ui/NavLinks.tsx`, `components/ui/MobileMenu.tsx`, `components/projects/ProjectCard.tsx`, `components/lab/LabCard.tsx`

**Interfaces:**
- Produces: `TransitionProvider` (client) holding `state: "idle" | "covering" | "uncovering"`; `TransitionLink` (wraps `next/link`): on click with no modifier keys, `preventDefault`, run cover (250 ms), `router.push`, then on pathname change run uncover (250 ms); re-entrancy: a second click during `covering` is ignored, during `uncovering` it queues; a 1.5 s watchdog forces `idle` (Review Focus 4). `PixelOverlay` is a fixed grid 24x14 of divs with `will-change: transform`, flipping in a diagonal wave (delay = (col + row) * 8 ms). Reduced motion: 150 ms opacity fade. Canvas stays visible (overlay `z-index` above content, canvas remains beneath; the hero storm simply continues).

- [ ] **Step 1: E2E first**: click a project card → URL changes and the overlay reaches `data-state="idle"` within 1.2 s; double-click rapidly → still ends `idle` and on the right page; reduced motion → no block elements animate (`[data-pixel-block]` count 0, fade overlay used).
- [ ] **Step 2: Implement**; keep `prefetch` behaviour of `next/link`.
- [ ] **Step 3: Commits.** `test: add page transition e2e`, `feat: transition provider with watchdog`, `feat: pixel dissolve overlay`, `feat: route all internal links through the transition`.

---

### Task 9: Custom cursor and cover pixelation

**Files:**
- Create: `components/motion/Cursor.tsx`, `components/motion/PixelateImage.tsx`, `tests/unit/pixelate.test.ts`, `tests/e2e/cursor.spec.ts`
- Modify: `app/layout.tsx`, `app/globals.css` (`cursor: none` on `html[data-cursor="custom"]` except inputs and textareas), `components/projects/ProjectCard.tsx`

**Interfaces:**
- Produces: `Cursor` (pointer devices only: `matchMedia("(pointer: fine)")`, not reduced motion, tier high): 8 px square with 60 ms lag, 6-square trail (mid tier: no trail), ring 40 px over `a, button, [data-cursor=ring]`, native cursor restored over `input, textarea, [data-cursor=native]`; `PixelateImage({ src, alt, steps = [16, 8, 4, 2] })` draws the image into a canvas and on hover animates the block size down the steps over 320 ms (pure helper `pixelateStepSizes(progress)` unit-tested).

- [ ] **Step 1: Unit test** `pixelateStepSizes`.
- [ ] **Step 2: E2E**: on chromium-desktop `html` has `data-cursor="custom"` and the cursor element exists; under reduced motion it does not; on webkit-mobile it does not.
- [ ] **Step 3: Implement** and wire; ensure axe is unaffected (cursor `aria-hidden`).
- [ ] **Step 4: Commits.** `feat: custom pixel cursor with trail`, `test: cursor presence e2e`, `feat: pixelate covers on hover`, `test: pixelate steps`.

---

### Task 10: Lab: pixel storm sandbox

**Files:**
- Create: `components/lab/PixelStormSandbox.tsx`, `content/lab/pixel-storm.mdx`, `public/lab/pixel-storm.webp`
- Modify: `components/lab/registry.ts`, `tests/e2e/lab.spec.ts`

**Interfaces:**
- Registers `PixelStormSandbox` under key `PixelStormSandbox`; sliders (native `<input type="range">` with visible labels): wind radius 60 to 300, stiffness 0.02 to 0.3, count 10k to 80k (tier-capped), shape picker (select) with the six shapes plus `name`.

- [ ] **Step 1: E2E**: `/lab` lists 2 items; `/lab/pixel-storm` shows four controls with labels and a canvas on default tier; poster under reduced motion.
- [ ] **Step 2: Implement**; thumbnail from a screenshot.
- [ ] **Step 3: Commits.** `feat: pixel storm sandbox lab item`, `content: add pixel storm lab entry`, `test: lab sandbox e2e`.

---

### Task 11: Copy, hero text and remaining surfaces

**Files:**
- Modify: `components/home/Hero.tsx` (name as sr-only h1 plus a visible pixel-font role line), `components/home/WhatIBuild.tsx` (copy to `content/site.json`), `components/ui/Footer.tsx` (year computed; copy from `content/site.json`), `components/lab/LabCard.tsx`, `components/about/Timeline.tsx` (pixel-font years, accent dots), `app/about/page.tsx`, `components/ui/MobileMenu.tsx` (visible word MENU in pixel font, links inside a `<nav>`), `lib/nav.ts`, `content/site.json` (new), `lib/schemas.ts` (`siteSchema`), `scripts/validate-content.ts`

**Interfaces:**
- `content/site.json` holds all UI copy that was in components: hero role line, hint, what-I-build cards, marquee items, lab intro, empty states, footer lines. `getSite()` loader; validated.

- [ ] **Step 1: Schema + loader + tests** (unit).
- [ ] **Step 2: Move copy**, apply pixel-font labels, MENU word, nav inside dialog.
- [ ] **Step 3: E2E** existing suites green (update expected strings only where copy intentionally changed; list them in the PR).
- [ ] **Step 4: Commits.** `feat: add site copy content file`, `refactor: move ui copy out of components`, `feat: pixel labels on timeline, menu and cards`.

---

### Task 12: Budgets, gates and docs

**Files:**
- Modify: `lighthouserc.json` (LCP back to `error`; add `resource-summary:script:size` split is not possible per chunk, so add a unit test that measures the gzipped size of the 3D chunk from `.next/static/chunks` after build in CI via a small script `scripts/check-chunk-budget.mjs` run in the `build-e2e` job after build), `.github/workflows/ci.yml` (controller commits via API), `tests/e2e/a11y.spec.ts` (keyboard test updated for new nav/hero), `docs/explanation/architecture.md`, `docs/reference/design-tokens.md`, `docs/how-to/tune-the-pixel-storm.md` (new), `docs/README.md`, `README.md` (screenshot refresh)
- Create: `scripts/check-chunk-budget.mjs`, `tests/unit/chunk-budget.test.ts`

**Interfaces:**
- `check-chunk-budget.mjs`: sums gzipped bytes of chunks whose source maps or names include `three`/`storm`/`fiber` (use the Next build manifest to find chunks imported by `CanvasRoot`), fails over 450 KB; also computes first-load JS excluding those chunks and fails over 350 KB. Prints both numbers.

- [ ] **Step 1: Budget script + unit test** (fixture manifest).
- [ ] **Step 2: Lighthouse** LCP `error`; run locally on the new hero; fix regressions (poster `priority`, font `display: swap`, preload the display font).
- [ ] **Step 3: Docs**: architecture (canvas, storm, transitions, tiers, with a Mermaid diagram), tokens, a how-to for tuning the storm, README screenshot.
- [ ] **Step 4: Visual baselines**: Playwright `toHaveScreenshot` for Home hero (both themes, reduced motion to make it deterministic) committed under `tests/e2e/__screenshots__`.
- [ ] **Step 5: Commits.** `ci: enforce chunk byte budgets`, `ci: make lcp a hard error again`, `test: visual baselines for the hero`, `docs: architecture and tokens for pixel storm`, `docs: add how to tune the pixel storm`, `docs: refresh readme screenshot`.

---

## Done when

- All 12 PRs merged, six required checks green, chunk budget script green.
- Home shows the pixel name storm reacting to the pointer, morphing into spinning project shapes every 8 s, with the marquee, reveals, custom cursor and pixel transitions.
- Reduced motion and no-WebGL visitors get static posters, fades, no cursor, no canvas, and axe stays clean.
- Lighthouse mobile: performance 85 or higher, LCP under 2.5 s on the three sampled pages.
- Mohammed looks at it and does not say "generic".
