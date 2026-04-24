# Design tokens reference

Complete reference for the CSS variables, Tailwind names and fonts that define the look of the site. All tokens live in `app/globals.css`.

## How tokens are wired

| Item | Detail | Location |
| --- | --- | --- |
| Light values | Defined on `:root` | `app/globals.css:24` |
| Dark values | Defined on `.dark`. They override five tokens. | `app/globals.css:47` |
| Dark switch | The `dark` variant matches `.dark` and its descendants | `app/globals.css:3` |
| Theme class | `next-themes` writes the class on `<html>`, default `system` | `components/ui/ThemeProvider.tsx:15` to `components/ui/ThemeProvider.tsx:17` |
| Tailwind names | `@theme inline` maps each variable to a Tailwind theme key | `app/globals.css:5` |
| Root font size | `18px` | `app/globals.css:56` to `app/globals.css:58` |
| Body | Applies `font-sans`, `bg-bg`, `text-text` | `app/globals.css:60` to `app/globals.css:62` |

## Colors

| Variable | Light | Dark | Tailwind name | Location |
| --- | --- | --- | --- | --- |
| `--bg` | `#fffbf5` | `#121117` | `bg-bg` | `app/globals.css:25`, `app/globals.css:48` |
| `--surface` | `#ffffff` | `#1b1a22` | `bg-surface` | `app/globals.css:26`, `app/globals.css:49` |
| `--text` | `#17161a` | `#f6f3ee` | `text-text` | `app/globals.css:27`, `app/globals.css:50` |
| `--muted` | `#5f5b66` | `#a39fad` | `text-muted` | `app/globals.css:28`, `app/globals.css:51` |
| `--border` | `#eae4da` | `#2a2833` | `border-border` | `app/globals.css:29`, `app/globals.css:52` |
| `--accent-1` | `#ff6b35` | same | `bg-accent-1` | `app/globals.css:30` |
| `--accent-2` | `#ffd23f` | same | `bg-accent-2` | `app/globals.css:31` |
| `--accent-3` | `#3bceac` | same | `bg-accent-3` | `app/globals.css:32` |
| `--accent-4` | `#5c7cfa` | same | `bg-accent-4` | `app/globals.css:33` |
| `--accent-5` | `#f06595` | same | `bg-accent-5` | `app/globals.css:34` |
| `--accent-6` | `#a78bfa` | same | `bg-accent-6` | `app/globals.css:35` |

The Tailwind color keys are `--color-bg` through `--color-accent-6` (`app/globals.css:6` to `app/globals.css:16`). Each accent works with every color utility, for example `text-accent-1` or `border-accent-3`.

The color scheme hint is `light` on `:root` and `dark` on `.dark` (`app/globals.css:44`, `app/globals.css:53`).

## Radii

| Variable | Value | Tailwind key | Location |
| --- | --- | --- | --- |
| `--radius-sm-value` | `12px` | `--radius-sm` | `app/globals.css:36`, `app/globals.css:17` |
| `--radius-md-value` | `20px` | `--radius-md` | `app/globals.css:37`, `app/globals.css:18` |
| `--radius-lg-value` | `32px` | `--radius-lg` | `app/globals.css:38`, `app/globals.css:19` |

Components read the radius through `var(--radius-sm)` and `var(--radius-md)`, for example `components/ui/Card.tsx:24`.

## Motion

| Variable | Value | Used in |
| --- | --- | --- |
| `--motion-fast` | `150ms` (`app/globals.css:39`) | `var(--motion-fast)` in component classes |
| `--motion-base` | `300ms` (`app/globals.css:40`) | Card hover lift (`components/ui/Card.tsx:38`) |
| `--motion-slow` | `500ms` (`app/globals.css:41`) | not used by a component yet |
| `--motion-xslow` | `800ms` (`app/globals.css:42`) | not used by a component yet |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (`app/globals.css:43`) | not used by a component yet |

Motion variables are not mapped through `@theme inline`. Components reference them as `duration-[var(--motion-base)]`. Motion classes are wrapped in `motion-safe:` so reduced motion turns them off (`components/ui/Card.tsx:38`).

## Fonts

Fonts load through `next/font/google` in `lib/fonts.ts`.

| Export | Family | Weights | CSS variable set by Next | Tailwind key | Location |
| --- | --- | --- | --- | --- | --- |
| `display` | Bricolage Grotesque | 500, 600, 700, 800 | `--font-display-src` | `--font-display` | `lib/fonts.ts:3` to `lib/fonts.ts:8`, `app/globals.css:20` |
| `sans` | Inter | default | `--font-sans-src` | `--font-sans` | `lib/fonts.ts:10` to `lib/fonts.ts:14`, `app/globals.css:21` |

Both use the `latin` subset and `display: "swap"` (`lib/fonts.ts:4`, `lib/fonts.ts:7`). The variable classes are added to `<html>` in `app/layout.tsx:31`. The Tailwind font stacks fall back to `ui-sans-serif, system-ui, sans-serif`. Use the `font-display` and `font-sans` utilities.

## Related

- [Architecture explanation](../explanation/architecture.md)
- [Configuration reference](configuration.md) for the CSP rule that allows inline styles.
