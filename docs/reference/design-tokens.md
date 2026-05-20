# Design tokens reference

Complete reference for the CSS variables, Tailwind names, fonts and overlays that define the look of the site. The look is Monolith: dark only, monochrome, hard corners. All tokens live in `app/globals.css`.

## How tokens are wired

| Item | Detail | Location |
| --- | --- | --- |
| Values | Defined on `:root`. There is one theme, dark. No `.light` or `.dark` block, no theme variants, no theme toggle. | `app/globals.css:25` to `app/globals.css:49` |
| Color scheme | `color-scheme: dark` | `app/globals.css:48` |
| Tailwind names | `@theme inline` maps each variable to a Tailwind theme key | `app/globals.css:3` to `app/globals.css:23` |
| Root font size | `16px` | `app/globals.css:51` to `app/globals.css:53` |
| Body | `font-sans` (which is mono), `bg-bg`, `text-text`, line height `1.6` | `app/globals.css:55` to `app/globals.css:58` |

## Colors

| Variable | Value | Tailwind name | Location |
| --- | --- | --- | --- |
| `--bg` | `#050505` | `bg-bg` | `app/globals.css:26` |
| `--surface` | `#0f0f11` | `bg-surface` | `app/globals.css:27` |
| `--surface-2` | `#17171a` | `bg-surface-2` | `app/globals.css:28` |
| `--border` | `#2a2a2e` | `border-border` | `app/globals.css:29` |
| `--muted` | `#808086` | `text-muted` | `app/globals.css:30` |
| `--text` | `#f2f2f0` | `text-text` | `app/globals.css:31` |
| `--glow` | `#ffffff` | `text-glow`, `border-glow` | `app/globals.css:32` |
| `--accent-1` to `--accent-6` | old palette, unused by pages | `bg-accent-1` to `bg-accent-6` | `app/globals.css:34` to `app/globals.css:39` |

The accents stay only because the pixel storm and the lab still read them (`app/globals.css:33`). They go when those are rebuilt.

### Muted contrast

The first choice, `#6b6b70`, measured 3.84:1 on `--bg`, 3.61:1 on `--surface` and 3.38:1 on `--surface-2`. The axe sweep failed on it. `#7a7a80` reaches 4.78:1 on `--bg` but only 4.49:1 on `--surface`, so it still fails inside cards. `#808086` gives 5.19:1, 4.88:1 and 4.56:1 on the three surfaces and passes AA at 320 and 1280 pixels.

## Radii

All radii are `0px`. The variables stay so older class names compile.

| Variable | Value | Location |
| --- | --- | --- |
| `--radius-sm-value` | `0px` | `app/globals.css:40` |
| `--radius-md-value` | `0px` | `app/globals.css:41` |
| `--radius-lg-value` | `0px` | `app/globals.css:42` |

## Surfaces

| Surface | Rule | Location |
| --- | --- | --- |
| Button, primary | `bg-text text-bg`, 1px `border-text`. Hover inverts to `bg-bg text-text`. | `components/ui/Button.tsx:31` |
| Button, secondary | Transparent, 1px `border-border`, wrapped in `Brackets` | `components/ui/Button.tsx:32` |
| Button, ghost | No border, `hover:bg-surface` | `components/ui/Button.tsx:33` |
| Button labels and focus | Mono, uppercase, `13px`, tracking `0.12em`. Focus ring is a 1px `--glow` outline. | `components/ui/Button.tsx:27` to `components/ui/Button.tsx:29` |
| Card | `bg-surface`, 1px `border-border`, brackets, no radius. The `color` prop is kept for callers and ignored. | `components/ui/Card.tsx:24` |
| Card link lift | Lifts `4px` on hover, only with `motion-safe:` | `components/ui/Card.tsx:35` |
| Tag | Mono caps, `10px`, tracking `0.12em`, 1px `border-border`, no colour dot | `components/ui/Tag.tsx:11` |
| Section title | `font-display`, tracking `-0.02em`, line height `0.9` | `components/ui/Section.tsx:17` |
| Skeleton | `bg-surface-2` | `components/ui/Skeleton.tsx:7` |

### Brackets

`Brackets` draws four corner marks, 8px square, with 1px `--glow` borders on the two outer sides. With `hover` on (the default) they grow to 16px on hover or focus-within. The growth is wrapped in `motion-safe:`. The marks are `aria-hidden` and take no clicks. Extra props, such as `data-*`, go to the wrapper. `components/ui/Brackets.tsx:11` to `components/ui/Brackets.tsx:19` holds the corners and the growth classes.

## Motion

| Variable | Value | Used in |
| --- | --- | --- |
| `--motion-fast` | `150ms` (`app/globals.css:43`) | Button colour (`components/ui/Button.tsx:27`), bracket growth (`components/ui/Brackets.tsx:19`), nav link colour (`components/ui/NavLinks.tsx:26`) |
| `--motion-base` | `300ms` (`app/globals.css:44`) | Card hover lift (`components/ui/Card.tsx:35`) |
| `--motion-slow` | `500ms` (`app/globals.css:45`) | not used by a component yet |
| `--motion-xslow` | `800ms` (`app/globals.css:46`) | not used by a component yet |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (`app/globals.css:47`) | not used by a component yet |

Motion variables are not mapped through `@theme inline`. Components reference them as `duration-[var(--motion-base)]`. Lifts and bracket growth are wrapped in `motion-safe:`, so reduced motion turns them off.

## Fonts

Both fonts load through `next/font/google`, which downloads them at build time and serves them from the site itself. They are SIL OFL fonts, and no font files are kept in the repo. Both use `display: "swap"` and are preloaded.

| Export | Family | Weights | CSS variable set by Next | Tailwind key | Location |
| --- | --- | --- | --- | --- | --- |
| `display` | Syne | 800 | `--font-display-src` | `--font-display` | `lib/fonts.ts:3` to `lib/fonts.ts:9`, `app/globals.css:20` |
| `mono` | JetBrains Mono | 400, 700 | `--font-mono-src` | `--font-mono` and `--font-sans` | `lib/fonts.ts:11` to `lib/fonts.ts:17`, `app/globals.css:21`, `app/globals.css:22` |

The body is mono, so `font-sans` and `font-mono` resolve to the same face. Both variable classes are added to `<html>` in `app/layout.tsx:33`.

Small labels use `font-mono uppercase tracking-[0.12em]`: tags (`components/ui/Tag.tsx:11`), nav links (`components/ui/NavLinks.tsx:26`), the footer line (`components/ui/Footer.tsx:26`), card index and year (`components/projects/ProjectCard.tsx:38`, `components/projects/ProjectCard.tsx:58`), project meta labels (`components/projects/ProjectMeta.tsx:8`) and the hero hint (`components/home/HeroHint.tsx:46`, `components/home/HeroHint.tsx:58`).

## Overlays

`components/ui/Overlays.tsx:9` draws one fixed, click-through, `aria-hidden` wrapper (`data-overlay`) with three layers, mounted after the footer (`app/layout.tsx:48`).

| Layer | Attribute | Look | Location |
| --- | --- | --- | --- |
| Scanlines | `data-overlay-scanlines` | 2px repeating gradient, white at `0.06` | `components/ui/Overlays.tsx:12` |
| Grain | `data-overlay-grain` | `feTurbulence` noise at `5%` opacity | `components/ui/Overlays.tsx:19` |
| Vignette | `data-overlay-vignette` | Radial gradient from clear at `55%` to black at `0.35` | `components/ui/Overlays.tsx:28` |

On the mid tier (`<html data-tier="mid">`) the scanlines and grain are hidden. The vignette stays (`app/globals.css:60` to `app/globals.css:63`).

## Layers

| Layer | z-index | Location |
| --- | --- | --- |
| Nav | `40` | `components/ui/Nav.tsx:9` |
| Mobile menu dialog | `50` | `components/ui/MobileMenu.tsx:103` |
| Overlays | `60`, above the dialog so they cover every surface | `components/ui/Overlays.tsx:10` |
| Page transition overlay (future) | `70` | not built yet |

The overlays never take clicks (`pointer-events-none`), so the layers below stay usable.

## Related

- [Architecture explanation](../explanation/architecture.md)
- [Configuration reference](configuration.md) for the CSP rule that allows inline styles.
