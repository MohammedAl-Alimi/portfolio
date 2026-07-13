# Project structure reference

Complete map of the repository: folders, important files, npm scripts and CI jobs.

## Repository tree

```text
portfolio/
├── app/                 Next.js App Router routes and metadata files
├── components/          React components grouped by feature
├── content/             All site copy and data (MDX and JSON)
├── docs/                This documentation, plus design spec and plan
├── lib/                 Pure helpers, schemas, content loaders, CSP
├── public/              Static files served as is
├── scripts/             Node and shell tools run by npm scripts or by hand
├── tests/               Unit tests, end to end tests and fixtures
├── proxy.ts             Per request nonce CSP and security headers
├── next.config.ts       Next.js options
└── (config files)       package.json, tsconfig, eslint, vitest, playwright, lighthouse
```

## app/

| Path | Responsibility | Exports |
| --- | --- | --- |
| `app/layout.tsx` | Root layout: fonts, theme provider, nav, footer, skip link. Reads the nonce header (`app/layout.tsx:27`). | `generateMetadata`, default `RootLayout` |
| `app/globals.css` | Tailwind import, theme mapping, CSS variables. See [Design tokens](design-tokens.md). | none |
| `app/page.tsx` | Home: hero, what I build, featured projects, highlights, Person JSON-LD. | `generateMetadata`, default `Home` |
| `app/projects/page.tsx` | Project grid with the `?tag=` filter (`app/projects/page.tsx:18`). | `metadata`, default `ProjectsPage` |
| `app/projects/[slug]/page.tsx` | Project case study. Unknown slugs 404 (`app/projects/[slug]/page.tsx:13`). | `dynamicParams`, `generateStaticParams`, `generateMetadata`, default `ProjectPage` |
| `app/projects/[slug]/opengraph-image.tsx` | Open Graph image per project, drawn with the shared frame from `lib/og.tsx`. | `size`, `contentType`, `generateStaticParams`, `generateImageMetadata`, default |
| `app/about/page.tsx` | About page from `content/about.mdx`. | `metadata`, default `AboutPage` |
| `app/lab/page.tsx` | Lab index sorted by `order`. | `metadata`, default `LabPage` |
| `app/lab/[slug]/page.tsx` | Lab item: iframe or registered component (`app/lab/[slug]/page.tsx:45`). | `dynamicParams`, `generateStaticParams`, `generateMetadata`, default `LabItemPage` |
| `app/cv/route.ts` | `GET /cv` permanently redirects to `/cv.pdf` (`app/cv/route.ts:4`). | `GET` |
| `app/sitemap.ts` | Sitemap from the content loaders. | default `sitemap` |
| `app/robots.ts` | Robots rules and sitemap link. | default `robots` |
| `app/opengraph-image.tsx` | Default Open Graph image, drawn with the shared frame from `lib/og.tsx`. | `size`, `contentType`, `generateImageMetadata`, default |
| `app/not-found.tsx` | 404 page. Renders `StaticField`, the figure as static that reassembles on click. | `metadata`, default `NotFound` |
| `app/fonts/og/` | Static Syne ExtraBold and JetBrains Mono Regular TTFs for the Open Graph images, with their SIL OFL 1.1 licences. Read at build by `ogFonts` (`lib/og.tsx:17`). | none |
| `app/error.tsx` | Route error boundary. Shows only the error digest (`app/error.tsx:33`). | default `ErrorPage` |
| `app/global-error.tsx` | Last resort boundary that replaces the root layout (`app/global-error.tsx:28`). | default `GlobalError` |

## components/

| Folder | Files | Responsibility |
| --- | --- | --- |
| `components/ui/` | `Brackets`, `Button`, `Card`, `Container`, `Footer`, `icons`, `MobileMenu`, `Nav`, `NavLinks`, `Overlays`, `Section`, `Skeleton`, `Tag`, `Wordmark` | Shared building blocks and site chrome. `Nav` is a server component (`components/ui/Nav.tsx:8`). `Overlays` draws the scanline, grain and vignette layers (`components/ui/Overlays.tsx`). |
| `components/home/` | `FeaturedProjects`, `Hero`, `HeroPoster`, `WhatIBuild` | Home sections. `HeroPoster` shows the static poster image (`components/home/HeroPoster.tsx:6`). |
| `components/projects/` | `AdjacentProjects`, `ProjectBody`, `ProjectCard`, `ProjectGrid`, `ProjectHero`, `ProjectMeta`, `TagFilter` | Project list and case study pieces. `ProjectCard` holds the stretched link (`components/projects/ProjectCard.tsx:46`). |
| `components/media/` | `Halftone` | Cover images as a two-tone Bayer dither on a canvas over the greyscale image (`components/media/Halftone.tsx:31`). |
| `components/about/` | `Timeline` | About timeline list. |
| `components/lab/` | `ComponentSlot`, `FigureSandbox`, `HowItWorks`, `LabCard`, `LabFrame`, `registry` | Lab cards, sandboxed iframe (`components/lab/LabFrame.tsx:8`), the figure sandbox (`components/lab/FigureSandbox.tsx:111`), and the registry of in-page experiments (`components/lab/registry.ts:5`). |
| `components/mdx/` | `components`, `MdxBody` | MDX rendering with link and image rules. `isSafeHref` is at `components/mdx/components.tsx:7`. |
| `components/seo/` | `JsonLd` | JSON-LD script with escaped `<` (`components/seo/JsonLd.tsx:13`). |

## lib/

| File | Responsibility | Exports |
| --- | --- | --- |
| `lib/schemas.ts` | Zod schemas and enumerations for all content. See [Content schema](content-schema.md). | `SHAPE_NAMES`, `TAG_NAMES`, `projectFrontmatterSchema`, `labFrontmatterSchema`, `highlightSchema`, `profileSchema`, `aboutFrontmatterSchema`, types |
| `lib/content-core.ts` | Reads and validates content from disk. | `getProjects`, `getProject`, `orderProjects`, `projectNumbers`, `getLabItems`, `getLabItem`, `getHighlights`, `getProfile`, `getAdjacentProjects`, `getAbout` |
| `lib/content.ts` | Re-exports the loaders behind `server-only` (`lib/content.ts:1`). | everything from `content-core` |
| `lib/csp.ts` | Builds the Content Security Policy string. | `buildCsp` |
| `lib/lab-origins.ts` | Allowlist of iframe origins. | `LAB_FRAME_ORIGINS`, `isAllowedLabOrigin` |
| `lib/site.ts` | Site origin and name. | `SITE_URL`, `SITE_NAME` |
| `lib/nav.ts` | Navigation items. | `NAV_ITEMS`, `NavLabel` |
| `lib/filter.ts` | Tag query parsing and project filtering. | `parseTagParam`, `filterProjects` |
| `lib/halftone.ts` | Pure Bayer 4 by 4 dither helpers for `Halftone`. | `BAYER4`, `bayerThreshold`, `luminance`, `ditherPixel` |
| `lib/og.tsx` | Fonts and the monochrome frame shared by both Open Graph images (server only). | `OG_SIZE`, `ogFonts`, `OgFrame` |
| `lib/project-links.ts` | Turns the `links` object into labelled links. | `projectLinks`, `ProjectLink` |
| `lib/fonts.ts` | Google fonts through `next/font`. | `display`, `sans` |
| `lib/cn.ts` | Class name merge helper. | `cn` |

## content/

| Path | Content | Schema |
| --- | --- | --- |
| `content/projects/*.mdx` | One case study per file, 7 files. | `projectFrontmatterSchema` (`lib/schemas.ts:35`) |
| `content/lab/*.mdx` | One lab item per file, 1 file (`content/lab/crowd-dashboard.mdx`). | `labFrontmatterSchema` (`lib/schemas.ts:63`) |
| `content/about.mdx` | About page text and timeline. | `aboutFrontmatterSchema` (`lib/schemas.ts:101`) |
| `content/profile.json` | Name, headline, contact, socials. | `profileSchema` (`lib/schemas.ts:90`) |
| `content/highlights.json` | Highlight posts. Currently an empty array. | `highlightSchema` (`lib/schemas.ts:84`) |

## scripts/ and other root files

| Path | Responsibility |
| --- | --- |
| `scripts/validate-content.ts` | Build-time content checks (`scripts/validate-content.ts:27`). |
| `scripts/check-secrets.sh` | Fast scan for secrets and personal strings (`scripts/check-secrets.sh:8`). |
| `scripts/screenshot.mjs` | Takes a page screenshot and saves it as WebP (`scripts/screenshot.mjs:1`). |
| `scripts/make-poster.mjs` | Generates the hero poster image (`scripts/make-poster.mjs:1`). |
| `proxy.ts` | Nonce CSP and security headers (`proxy.ts:4`). |
| `.env.example` | Environment variable template. |
| `.gitleaks.toml` | Secret scanner config. |
| `.nvmrc` | Node version, `24` (`.nvmrc:1`). |
| `vercel.json` | Vercel project settings. |

## tests/

| Path | Content |
| --- | --- |
| `tests/unit/` | Vitest tests (`*.test.ts` and `*.test.tsx`), `setup.ts`, and a `server-only` mock. |
| `tests/e2e/` | Playwright specs: a11y, about, errors, home, lab, navigation, project page, projects, security, seo. |
| `tests/fixtures/` | Small content trees used by the loader tests. |

## npm scripts

| Name | Command | Purpose |
| --- | --- | --- |
| `dev` | `next dev` | Dev server (`package.json:6`). |
| `prebuild` | `npm run validate:content` | Runs automatically before `build` (`package.json:7`). |
| `build` | `next build` | Production build (`package.json:8`). |
| `start` | `next start` | Serves the production build (`package.json:9`). |
| `lint` | `eslint` | Lint (`package.json:10`). |
| `typecheck` | `tsc --noEmit` | Type check (`package.json:11`). |
| `check:secrets` | `bash scripts/check-secrets.sh` | Secret and personal string scan (`package.json:12`). |
| `validate:content` | `tsx scripts/validate-content.ts` | Validate all content (`package.json:13`). |
| `test` | `vitest run` | Unit tests once (`package.json:14`). |
| `test:watch` | `vitest` | Unit tests in watch mode (`package.json:15`). |
| `test:e2e` | `playwright test` | End to end tests (`package.json:16`). |
| `lhci` | `lhci autorun` | Lighthouse CI (`package.json:17`). |

## CI jobs

| Job | File | What it runs | Required on `main` |
| --- | --- | --- | --- |
| `lint` | `.github/workflows/ci.yml:16` | `npm run lint` | yes |
| `typecheck` | `.github/workflows/ci.yml:27` | `npm run typecheck` | yes |
| `secrets` | `.github/workflows/ci.yml:38` | `scripts/check-secrets.sh`, then the gitleaks action | yes |
| `unit` | `.github/workflows/ci.yml:54` | `npm run test` | yes |
| `build-e2e` | `.github/workflows/ci.yml:65` | Playwright browser install, then `npm run test:e2e` | yes |
| `lighthouse` | `.github/workflows/lighthouse.yml:10` | `npm run build`, then `npm run lhci` | yes |

The six required contexts are `lint`, `typecheck`, `secrets`, `unit`, `build-e2e` and `lighthouse`. Branch protection is set on GitHub, not in a file in this repository. See [Configuration](configuration.md) for the details.
