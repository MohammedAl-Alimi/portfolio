# Design tokens reference

This page lists the CSS variables, Tailwind names, fonts, overlays, layers and `<html>` attributes that set the look of the site. The look is called Monolith: dark only, monochrome, hard corners. Every token lives in `app/globals.css`.

## How tokens are wired

| Item | Detail | Location |
| --- | --- | --- |
| Values | Defined on `:root`. There is one theme, dark. No `.light` or `.dark` block, no theme variants, no theme toggle. | `app/globals.css:19` to `app/globals.css:38` |
| Color scheme | `color-scheme: dark` | `app/globals.css:37` |
| Tailwind names | `@theme inline` maps each variable to a Tailwind theme key | `app/globals.css:3` to `app/globals.css:17` |
| Root font size | `16px` | `app/globals.css:40` to `app/globals.css:42` |
| Body | `font-sans` (which is mono), `bg-bg`, `text-text`, line height `1.6` | `app/globals.css:44` to `app/globals.css:47` |

## Colors

The site has no colour outside the Lab. Only the greys below are defined. `tests/e2e/colors.spec.ts` fails if an old accent hex shows up in a page's HTML, its CSS or a computed style.

| Variable | Value | Tailwind name | Location |
| --- | --- | --- | --- |
| `--bg` | `#050505` | `bg-bg` | `app/globals.css:20` |
| `--surface` | `#0f0f11` | `bg-surface` | `app/globals.css:21` |
| `--surface-2` | `#17171a` | `bg-surface-2` | `app/globals.css:22` |
| `--border` | `#2a2a2e` | `border-border` | `app/globals.css:23` |
| `--muted` | `#808086` | `text-muted` | `app/globals.css:24` |
| `--text` | `#f2f2f0` | `text-text` | `app/globals.css:25` |
| `--glow` | `#ffffff` | `bg-glow`, `border-glow`, `outline-[var(--glow)]` | `app/globals.css:26` |
| `--grid-line` | `--glow` at 10% (`color-mix`) | none, read as `var(--grid-line)` | `app/globals.css:28` |

### Glow

`--glow` is the one pure white. It marks a live or active element, never body text:

- Focus rings: a 1px outline (`components/nav/Rail.tsx:8`).
- The active tab bar: 2px, on the rail (`components/nav/Rail.tsx:12`) and the bottom bar (`components/nav/TabBar.tsx:7`).
- Bracket corners (`components/ui/Brackets.tsx:37`).
- The crosshair (`components/motion/Crosshair.tsx:185` to `components/motion/Crosshair.tsx:196`).
- The ticker scanline, at 14% (`app/globals.css:148`).
- The grid floor, through `--grid-line` (`components/motion/GridFloor.tsx:60`).

### Muted contrast

The first choice was `#6b6b70`. It measured 3.84:1 on `--bg`, 3.61:1 on `--surface` and 3.38:1 on `--surface-2`, and the axe sweep failed on it.

`#7a7a80` reaches 4.78:1 on `--bg` but only 4.49:1 on `--surface`, so it still fails inside cards.

`#808086` gives 5.19:1, 4.88:1 and 4.56:1 on the three surfaces. It passes AA at 320 and 1280 pixels.

## Radii

All radii are `0px`. The variables stay so that older class names still compile.

| Variable | Value | Location |
| --- | --- | --- |
| `--radius-sm-value` | `0px` | `app/globals.css:29` |
| `--radius-md-value` | `0px` | `app/globals.css:30` |
| `--radius-lg-value` | `0px` | `app/globals.css:31` |

## Surfaces

| Surface | Rule | Location |
| --- | --- | --- |
| Button, base | Mono, uppercase, `13px`, bold, at least 44px tall. Colour changes in `--motion-fast`. | `components/ui/Button.tsx:30` |
| Button, primary | `bg-text text-bg`, 1px `border-text`. Hover inverts to `bg-bg text-text`. | `components/ui/Button.tsx:33` |
| Button, secondary | Transparent, 1px `border-border`, wrapped in `Brackets` | `components/ui/Button.tsx:34` |
| Button, ghost | No border, `hover:bg-surface` | `components/ui/Button.tsx:35` |
| Card | `bg-surface`, 1px `border-border`, no radius. The `color` prop is kept for callers and ignored. | `components/ui/Card.tsx:8`, `components/ui/Card.tsx:24` |
| Card link lift | Lifts on hover in `--motion-base`, only with `motion-safe:` | `components/ui/Card.tsx:35` |
| Tag | Mono caps, `10px`, 1px `border-border`, no colour dot | `components/ui/Tag.tsx:11` |
| Section title | `font-display`, tracking `-0.02em`, line height `0.9` | `components/ui/Section.tsx:15` |
| Skeleton | `bg-surface-2`, pulse off under reduced motion | `components/ui/Skeleton.tsx:7` |

### Brackets

`Brackets` draws four corner marks. Each is 8px square, with 1px `--glow` borders on its two outer sides (`components/ui/Brackets.tsx:37`).

With `hover` on (the default), the marks grow to 16px on hover or focus-within, in `--motion-fast` and only with `motion-safe:` (`components/ui/Brackets.tsx:19`). The marks are `aria-hidden` and take no clicks.

## Motion

| Variable | Value | Used in |
| --- | --- | --- |
| `--motion-fast` | `150ms` (`app/globals.css:32`) | Rail link colour (`components/nav/Rail.tsx:10`), button colour (`components/ui/Button.tsx:30`), bracket growth (`components/ui/Brackets.tsx:19`) |
| `--motion-base` | `300ms` (`app/globals.css:33`) | Rail width and label fade (`components/nav/Rail.tsx:18`, `components/nav/Rail.tsx:35`), card lift (`components/ui/Card.tsx:35`, `components/projects/ProjectCard.tsx:24`) |
| `--motion-slow` | `500ms` (`app/globals.css:34`) | not used by a component yet |
| `--motion-xslow` | `800ms` (`app/globals.css:35`) | not used by a component yet |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (`app/globals.css:36`) | The glitch wipe uses the same curve as a constant (`components/motion/GlitchOverlay.tsx:22`) |

Motion variables are not mapped through `@theme inline`. Components reference them as `duration-[var(--motion-base)]`. Transitions are wrapped in `motion-safe:`, so reduced motion turns them off.

Fixed durations live next to the effect they belong to:

| Effect | Duration | Location |
| --- | --- | --- |
| Glitch wipe, cover and uncover | 200 ms each, 6 ms stagger per band | `components/motion/GlitchOverlay.tsx:19`, `components/motion/GlitchOverlay.tsx:21` |
| Reduced motion veil | 150 ms in, 150 ms out | `components/motion/GlitchOverlay.tsx:20` |
| Transition watchdog | 1500 ms | `components/motion/TransitionProvider.tsx:36` |
| Cursor bracket spring | 120 ms | `app/globals.css:68` to `app/globals.css:70` |
| Decode fallback fade | 300 ms after 1200 ms | `app/globals.css:95` |
| Ticker slide and scanline | 60 s per loop, 4 s per sweep | `app/globals.css:131`, `app/globals.css:151` |

## Fonts

Both fonts load through `next/font/google`. Next downloads them at build time and serves them from the site itself. They are SIL OFL fonts, and no font files are kept in the repo for the site (the copies in `app/fonts/og/` are only for the Open Graph images). Both use `display: "swap"` and are preloaded.

| Export | Family | Weights | CSS variable set by Next | Tailwind key | Location |
| --- | --- | --- | --- | --- | --- |
| `display` | Syne | 800 | `--font-display-src` | `--font-display` | `lib/fonts.ts:3` to `lib/fonts.ts:9`, `app/globals.css:14` |
| `mono` | JetBrains Mono | 400, 700 | `--font-mono-src` | `--font-mono` and `--font-sans` | `lib/fonts.ts:11` to `lib/fonts.ts:17`, `app/globals.css:15`, `app/globals.css:16` |

The body is mono, so `font-sans` and `font-mono` resolve to the same face. Both variable classes are added to `<html>` in `app/layout.tsx:37`.

## Overlays

`components/ui/Overlays.tsx:10` draws one fixed `data-overlay` wrapper. It takes no clicks, is `aria-hidden`, and has three layers. It is mounted after the content (`app/layout.tsx:57`).

| Layer | Attribute | Look | Location |
| --- | --- | --- | --- |
| Scanlines | `data-overlay-scanlines` | 2px repeating gradient, white at `0.06` | `components/ui/Overlays.tsx:12` |
| Grain | `data-overlay-grain` | `feTurbulence` noise at `5%` opacity | `components/ui/Overlays.tsx:19` |
| Vignette | `data-overlay-vignette` | Radial gradient from clear at `55%` to black at `0.35` | `components/ui/Overlays.tsx:28` |

On the mid tier (`<html data-tier="mid">`), the scanlines and the grain are hidden. The vignette stays (`app/globals.css:85` to `app/globals.css:88`). The project hero repeats the scanlines on its backdrop (`components/projects/ProjectHero.tsx:25`).

## Layers

| Layer | z-index | Location |
| --- | --- | --- |
| Persistent canvas | `-1`, behind the page | `components/three/CanvasRoot.tsx:20` |
| Rail and bottom bar | `40` | `components/nav/Rail.tsx:18`, `components/nav/TabBar.tsx:13` |
| Skip link, when focused | `50` | `app/layout.tsx:42` |
| Overlays | `60` | `components/ui/Overlays.tsx:10` |
| Crosshair cursor | `65` | `components/motion/Crosshair.tsx:182` |
| Glitch wipe | `70`, above everything while a route changes | `components/motion/GlitchOverlay.tsx:136` |

The overlays and the cursor never take clicks (`pointer-events-none`). The glitch wipe takes the pointer only while it runs (`components/motion/GlitchOverlay.tsx:137`).

## Attributes on `<html>`

Scripts set these attributes, and CSS and tests read them.

| Attribute | Values | Set by | Read by |
| --- | --- | --- | --- |
| `data-tier` | `high`, `mid`, `low`. Missing until the first client effect runs. | `lib/use-tier.ts:24`, lowered to `mid` after the frame probe at `lib/use-tier.ts:43` | `app/globals.css:85`, `app/globals.css:154` |
| `data-reduced-motion` | `true` when the visitor asks for reduced motion | `lib/use-tier.ts:25` | e2e tests only. CSS uses the media query instead. |
| `data-cursor` | `custom` while the crosshair runs | `components/motion/Crosshair.tsx:109`, removed at `components/motion/Crosshair.tsx:172` | `app/globals.css:52`, `app/globals.css:56` |

The tier rules are in `lib/device.ts:16` to `lib/device.ts:23`:
- Reduced motion, no WebGL 2 or Save-Data gives `low`.
- A small device (4 cores or fewer and 4 GB or less) gives `mid`.
- Everything else gives `high`.

## Related

- [Architecture explanation](../explanation/architecture.md)
- [Configuration reference](configuration.md) for the CSP rule that allows inline styles.
