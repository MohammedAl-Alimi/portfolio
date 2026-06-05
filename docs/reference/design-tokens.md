# Design tokens reference

Complete reference for the CSS variables, Tailwind names and fonts that define the look of the site. All tokens live in `app/globals.css`.

## How tokens are wired

| Item | Detail | Location |
| --- | --- | --- |
| Dark values (default) | Defined on `:root`, so dark applies with no class set | `app/globals.css:26` |
| Dark class | `.dark` repeats the dark values so `next-themes` can write `dark` | `app/globals.css:49` |
| Light values | Defined on `.light` | `app/globals.css:58` |
| Variants | `dark:` matches `.dark`, `light:` matches `.light` and their descendants | `app/globals.css:3`, `app/globals.css:4` |
| Theme class | `next-themes` writes `dark` or `light` on `<html>`. Default `dark`, system preference ignored. | `components/ui/ThemeProvider.tsx:16` to `components/ui/ThemeProvider.tsx:18` |
| Tailwind names | `@theme inline` maps each variable to a Tailwind theme key | `app/globals.css:6` |
| Root font size | `18px` | `app/globals.css:67` to `app/globals.css:69` |
| Body | Applies `font-sans`, `bg-bg`, `text-text` | `app/globals.css:71` to `app/globals.css:73` |

## Colors

Dark is the default. The muted colour needed no change: the axe sweep passes in both themes at 320 and 1280 pixels with the values below.

| Variable | Dark (default) | Light | Tailwind name | Location |
| --- | --- | --- | --- | --- |
| `--bg` | `#0b0b10` | `#fffbf5` | `bg-bg` | `app/globals.css:27`, `app/globals.css:59` |
| `--surface` | `#141420` | `#ffffff` | `bg-surface` | `app/globals.css:28`, `app/globals.css:60` |
| `--text` | `#f6f3ee` | `#17161a` | `text-text` | `app/globals.css:29`, `app/globals.css:61` |
| `--muted` | `#a39fad` | `#5f5b66` | `text-muted` | `app/globals.css:30`, `app/globals.css:62` |
| `--border` | `#2a2833` | `#eae4da` | `border-border` | `app/globals.css:31`, `app/globals.css:63` |
| `--accent-1` | `#ff6b35` | same | `bg-accent-1` | `app/globals.css:32` |
| `--accent-2` | `#ffd23f` | same | `bg-accent-2` | `app/globals.css:33` |
| `--accent-3` | `#3bceac` | same | `bg-accent-3` | `app/globals.css:34` |
| `--accent-4` | `#5c7cfa` | same | `bg-accent-4` | `app/globals.css:35` |
| `--accent-5` | `#f06595` | same | `bg-accent-5` | `app/globals.css:36` |
| `--accent-6` | `#a78bfa` | same | `bg-accent-6` | `app/globals.css:37` |

The Tailwind color keys are `--color-bg` through `--color-accent-6` (`app/globals.css:7` to `app/globals.css:17`). Each accent works with every color utility, for example `text-accent-1` or `border-accent-3`.

The color scheme hint is `dark` on `:root` and `.dark`, and `light` on `.light` (`app/globals.css:46`, `app/globals.css:55`, `app/globals.css:64`).

## Radii

Corners are hard. Small radii are for buttons, medium for cards, large for big panels.

| Variable | Value | Tailwind key | Location |
| --- | --- | --- | --- |
| `--radius-sm-value` | `4px` | `--radius-sm` | `app/globals.css:38`, `app/globals.css:18` |
| `--radius-md-value` | `8px` | `--radius-md` | `app/globals.css:39`, `app/globals.css:19` |
| `--radius-lg-value` | `12px` | `--radius-lg` | `app/globals.css:40`, `app/globals.css:20` |

Components read the radius through `var(--radius-sm)` and `var(--radius-md)`, for example `components/ui/Card.tsx:24`. Tags use a fixed `2px` radius (`components/ui/Tag.tsx:13`).

## Surfaces

| Surface | Rule | Location |
| --- | --- | --- |
| Button | `2px` border. Primary and secondary get a `2px 2px 0` accent-4 shadow and a one pixel lift on hover. | `components/ui/Button.tsx:27`, `components/ui/Button.tsx:29` to `components/ui/Button.tsx:34` |
| Card | `2px` border, in the project colour when given, otherwise `border-border`. No shadow. | `components/ui/Card.tsx:24` |
| Tag | Pixel font, uppercase, `11px`, `1px` border | `components/ui/Tag.tsx:13` |

## Motion

| Variable | Value | Used in |
| --- | --- | --- |
| `--motion-fast` | `150ms` (`app/globals.css:41`) | Button hover (`components/ui/Button.tsx:27`), nav link colour (`components/ui/NavLinks.tsx:26`), theme toggle (`components/ui/ThemeToggle.tsx:26`) |
| `--motion-base` | `300ms` (`app/globals.css:42`) | Card hover lift (`components/ui/Card.tsx:39`) |
| `--motion-slow` | `500ms` (`app/globals.css:43`) | not used by a component yet |
| `--motion-xslow` | `800ms` (`app/globals.css:44`) | not used by a component yet |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (`app/globals.css:45`) | not used by a component yet |

Motion variables are not mapped through `@theme inline`. Components reference them as `duration-[var(--motion-base)]`. The card lift and the button shadow and shift are wrapped in `motion-safe:`, so reduced motion turns them off. The colour transitions run regardless of the motion preference.

## Fonts

All three fonts load through `next/font/google`, which downloads them at build time and serves them from the site itself. They are SIL OFL fonts, and no font files are kept in the repo. All use `display: "swap"`.

| Export | Family | Weights | CSS variable set by Next | Tailwind key | Location |
| --- | --- | --- | --- | --- | --- |
| `display` | Unbounded | 600, 700 | `--font-display-src` | `--font-display` | `lib/fonts.ts:3` to `lib/fonts.ts:9`, `app/globals.css:21` |
| `sans` | Manrope | 400, 500 | `--font-sans-src` | `--font-sans` | `lib/fonts.ts:11` to `lib/fonts.ts:16`, `app/globals.css:22` |
| `pixel` | Silkscreen | 400 | `--font-pixel-src` | `--font-pixel` | `lib/fonts.ts:18` to `lib/fonts.ts:23`, `app/globals.css:23` |

The display font is preloaded (`lib/fonts.ts:8`). The three variable classes are added to `<html>` in `app/layout.tsx:32`. Use the `font-display`, `font-sans` and `font-pixel` utilities.

Where the pixel font is used: tags (`components/ui/Tag.tsx:13`), nav links (`components/ui/NavLinks.tsx:26`), card year (`components/projects/ProjectCard.tsx:57`), project meta labels (`components/projects/ProjectMeta.tsx:8`) and the footer line (`components/ui/Footer.tsx:26`). Section titles and page headings use `font-display tracking-[-0.03em] leading-[0.9]` (for example `components/ui/Section.tsx:17`).

## Grain overlay

`components/ui/Grain.tsx:1` draws a fixed, click-through noise layer (`feTurbulence`) at `6%` opacity, `4%` in the light theme (`components/ui/Grain.tsx:6`). It is mounted after the footer (`app/layout.tsx:48`). It is hidden when `<html>` has `data-tier="mid"` (`app/globals.css:75`).

## Related

- [Architecture explanation](../explanation/architecture.md)
- [Configuration reference](configuration.md) for the CSP rule that allows inline styles.
