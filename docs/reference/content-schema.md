# Content schema reference

Complete reference for the content files, the Zod schemas that validate them, the loader functions and the checks that run at build time.

Every schema lives in `lib/schemas.ts`. Object schemas use `z.strictObject`, so an unknown field is an error (for example `lib/schemas.ts:36`).

## Enumerations

| Name | Values | Location |
| --- | --- | --- |
| `SHAPE_NAMES` | `sphere`, `box`, `icosahedron`, `torusKnot`, `capsule`, `octahedron` | `lib/schemas.ts:3` |
| `TAG_NAMES` | `ai`, `computer-vision`, `agents`, `security`, `data`, `web`, `privacy` | `lib/schemas.ts:13` |

## Shared value rules

| Rule | Constraint | Location |
| --- | --- | --- |
| `hexColor` | Matches `^#[0-9A-Fa-f]{6}$`. Message: `must be a 6 digit hex color like #FF6B35`. | `lib/schemas.ts:24` |
| `httpsUrl` | A valid URL whose protocol is `https:`. | `lib/schemas.ts:26` |
| `linkedinUrl` | An `httpsUrl` whose host is `www.linkedin.com` or `linkedin.com`. | `lib/schemas.ts:30` |

## Project frontmatter

File: `content/projects/<slug>.mdx`. Schema: `projectFrontmatterSchema` (`lib/schemas.ts:35`).

| Field | Type | Constraint | Default | Example |
| --- | --- | --- | --- | --- |
| `title` | string | 1 to 80 characters (`lib/schemas.ts:37`) | required | `Bloomline` |
| `slug` | string | `^[a-z0-9-]+$` (`lib/schemas.ts:38`). Must equal the file name without `.mdx`. | required | `bloomline` |
| `tagline` | string | 1 to 120 characters (`lib/schemas.ts:39`) | required | `A calm mind mapping canvas` |
| `color` | string | `hexColor` (`lib/schemas.ts:40`) | required | `"#FF6B35"` |
| `shape` | enum | One of `SHAPE_NAMES` (`lib/schemas.ts:41`) | required | `sphere` |
| `tags` | array of enum | 1 to 5 items of `TAG_NAMES` (`lib/schemas.ts:42`) | required | `[web]` |
| `year` | integer | 2018 to 2100 (`lib/schemas.ts:43`) | required | `2026` |
| `role` | string | At least 1 character (`lib/schemas.ts:44`) | required | `Solo developer` |
| `featured` | boolean | none (`lib/schemas.ts:45`) | `false` | `true` |
| `order` | integer | none (`lib/schemas.ts:46`) | `99` | `1` |
| `links` | object | Strict. Keys `repo`, `live`, `demo`, each an optional `httpsUrl` (`lib/schemas.ts:47` to `lib/schemas.ts:53`) | `{}` | `{ repo: "https://github.com/..." }` |
| `cover` | string | Must start with `/projects/` (`lib/schemas.ts:54`). The file must exist under `public/` (see [Validation script](#validation-script)). | none | `/projects/bloomline/cover.webp` |
| `coverAlt` | string | At least 1 character (`lib/schemas.ts:55`). Required when `cover` is set (`lib/schemas.ts:58` to `lib/schemas.ts:61`). | none | `Bloomline map view` |
| `stack` | array of string | 1 to 12 non-empty items (`lib/schemas.ts:56`) | required | `[Next.js, Supabase]` |

The MDX body after the frontmatter is the case study text. It is not validated beyond being valid MDX.

## Lab frontmatter

File: `content/lab/<slug>.mdx`. Schema: `labFrontmatterSchema` (`lib/schemas.ts:63`).

| Field | Type | Constraint | Default | Example |
| --- | --- | --- | --- | --- |
| `title` | string | 1 to 80 characters (`lib/schemas.ts:65`) | required | `Crowd dashboard` |
| `slug` | string | `^[a-z0-9-]+$` (`lib/schemas.ts:66`). Must equal the file name without `.mdx`. | required | `crowd-dashboard` |
| `description` | string | 1 to 140 characters (`lib/schemas.ts:67`) | required | `A live dashboard...` |
| `kind` | enum | `component` or `iframe` (`lib/schemas.ts:68`) | required | `iframe` |
| `component` | string | At least 1 character (`lib/schemas.ts:69`). Required when `kind` is `component` (`lib/schemas.ts:76`). | none | `SandboxScene` |
| `url` | string | `httpsUrl` (`lib/schemas.ts:70`). Required when `kind` is `iframe` (`lib/schemas.ts:79`). | none | `https://crowdmonitoringdashboard.vercel.app` |
| `thumbnail` | string | Must start with `/lab/` (`lib/schemas.ts:71`) | required | `/lab/crowd-dashboard.webp` |
| `thumbnailAlt` | string | At least 1 character (`lib/schemas.ts:72`) | required | `Crowd dashboard with counters` |
| `order` | integer | none (`lib/schemas.ts:73`) | `99` | `1` |

## About frontmatter

File: `content/about.mdx`. Schema: `aboutFrontmatterSchema` (`lib/schemas.ts:101`).

| Field | Type | Constraint | Default | Example |
| --- | --- | --- | --- | --- |
| `title` | string | 1 to 80 characters (`lib/schemas.ts:102`) | required | `About me` |
| `intro` | string | 1 to 200 characters (`lib/schemas.ts:103`) | required | `I am a computer science student...` |
| `timeline` | array of object | 1 to 8 entries (`lib/schemas.ts:104` to `lib/schemas.ts:113`) | required | see below |
| `timeline[].year` | string | `^\d{4}(\s?-\s?(\d{4}\|now))?$` (`lib/schemas.ts:107`) | required | `"2025 - 2026"` |
| `timeline[].title` | string | 1 to 80 characters (`lib/schemas.ts:108`) | required | `B.Sc. thesis` |
| `timeline[].detail` | string | 1 to 200 characters (`lib/schemas.ts:109`) | required | `Studying in Berlin.` |
| `outside` | array of string | 1 to 8 items, each 1 to 80 characters (`lib/schemas.ts:114`) | required | `[Running]` |

## Highlight

File: `content/highlights.json`, an array of objects. Schema: `highlightSchema` (`lib/schemas.ts:84`).

| Field | Type | Constraint | Default | Example |
| --- | --- | --- | --- | --- |
| `url` | string | `linkedinUrl` (`lib/schemas.ts:85`) | required | `https://www.linkedin.com/posts/...` |
| `date` | string | ISO date, `YYYY-MM-DD` (`lib/schemas.ts:86`) | required | `2026-10-01` |
| `caption` | string | 1 to 140 characters (`lib/schemas.ts:87`) | required | `Shipped the portfolio` |

## Profile

File: `content/profile.json`. Schema: `profileSchema` (`lib/schemas.ts:90`).

| Field | Type | Constraint | Default | Example |
| --- | --- | --- | --- | --- |
| `name` | string | At least 1 character (`lib/schemas.ts:91`) | required | `Mohammed Al-Alimi` |
| `headline` | string | At least 1 character (`lib/schemas.ts:92`) | required | `I build AI systems...` |
| `bio` | string | At least 1 character (`lib/schemas.ts:93`) | required | `I recently finished...` |
| `email` | string | Valid email (`lib/schemas.ts:94`) | required | `name@example.com` |
| `location` | string | At least 1 character (`lib/schemas.ts:95`) | required | `Germany` |
| `availability` | string | At least 1 character (`lib/schemas.ts:96`) | required | `Open to roles from 2027` |
| `socials.github` | string | `httpsUrl` (`lib/schemas.ts:97`) | required | `https://github.com/MohammedAl-Alimi` |
| `socials.linkedin` | string | `httpsUrl` (`lib/schemas.ts:97`) | required | `https://www.linkedin.com/in/...` |
| `decorationColors` | array of string | 2 to 6 `hexColor` items (`lib/schemas.ts:98`) | required | `["#FFD23F", "#3BCEAC"]` |

## Content loaders

All loaders are in `lib/content-core.ts`. Components import them from `lib/content.ts`, which adds `server-only` (`lib/content.ts:1`). Every loader takes an optional content directory that defaults to `<cwd>/content` (`lib/content-core.ts:22`).

| Function | Signature | Returns | Sort order | Location |
| --- | --- | --- | --- | --- |
| `getProjects` | `(dir?: string) => Promise<Project[]>` | All projects | `order` ascending, then `year` descending | `lib/content-core.ts:84` |
| `getProject` | `(slug: string, dir?: string) => Promise<Project \| null>` | One project or `null` | n/a | `lib/content-core.ts:92` |
| `getLabItems` | `(dir?: string) => Promise<LabItem[]>` | All lab items | `order` ascending | `lib/content-core.ts:97` |
| `getLabItem` | `(slug: string, dir?: string) => Promise<LabItem \| null>` | One lab item or `null` | n/a | `lib/content-core.ts:102` |
| `getHighlights` | `(dir?: string) => Promise<Highlight[]>` | All highlights | `date` descending | `lib/content-core.ts:107` |
| `getProfile` | `(dir?: string) => Promise<Profile>` | The profile | n/a | `lib/content-core.ts:116` |
| `getAdjacentProjects` | `(slug: string, dir?: string) => Promise<{ previous, next }>` | Neighbours in the sorted project list, each `Project \| null` | n/a | `lib/content-core.ts:120` |
| `getAbout` | `(dir?: string) => Promise<About>` | The about page | n/a | `lib/content-core.ts:130` |

Returned shapes: `Project`, `About` and `LabItem` are `{ frontmatter, body }` (`lib/content-core.ts:18` to `lib/content-core.ts:20`).

### Loader behaviour

| Behaviour | Detail | Location |
| --- | --- | --- |
| File filter | Only names ending in `.mdx`, sorted by name. | `lib/content-core.ts:45` |
| Missing folder | `projects/` or `lab/` missing returns an empty list. | `lib/content-core.ts:42` |
| Invalid frontmatter | Throws `Invalid frontmatter in <file>: <path> <message>; ...`. | `lib/content-core.ts:52` |
| Slug mismatch | Throws if `slug` does not match the file name. | `lib/content-core.ts:54` |
| Missing `highlights.json` | Returns `[]`. | `lib/content-core.ts:68`, `lib/content-core.ts:111` |
| Missing `profile.json` | Throws `Could not read profile.json: ...`. | `lib/content-core.ts:69` |
| Bad JSON | Throws `Invalid JSON in <file>`. | `lib/content-core.ts:75` |
| Schema failure in JSON | Throws `Invalid content in <file>: ...`. | `lib/content-core.ts:79` |

## Validation script

Command: `npm run validate:content`, which runs `scripts/validate-content.ts`. The `prebuild` script runs it before every build (`package.json:7`). On any problem it prints each one as `validate-content: <message>` and exits with code 1 (`scripts/validate-content.ts:51` to `scripts/validate-content.ts:54`).

| Check | Detail | Location |
| --- | --- | --- |
| All schemas | Loads projects, lab items, highlights, profile and about, so every schema runs. | `scripts/validate-content.ts:28` to `scripts/validate-content.ts:34` |
| Unique slugs | Fails on a duplicate project slug or lab slug. | `scripts/validate-content.ts:14`, `scripts/validate-content.ts:36`, `scripts/validate-content.ts:37` |
| Project covers exist | A `cover` must point to a file under `public/`. | `scripts/validate-content.ts:22`, `scripts/validate-content.ts:40` |
| Lab thumbnails exist | A `thumbnail` must point to a file under `public/`. | `scripts/validate-content.ts:43` |
| Iframe origin allowed | An `iframe` lab item must have a `url` whose origin is in `LAB_FRAME_ORIGINS`. | `scripts/validate-content.ts:44` |

On success it prints the counts, for example `projects: 7, lab: 1, highlights: 0` (`scripts/validate-content.ts:55`).

## Lab iframe origin allowlist

| Item | Detail | Location |
| --- | --- | --- |
| `LAB_FRAME_ORIGINS` | `["https://crowdmonitoringdashboard.vercel.app"]` | `lib/lab-origins.ts:2` |
| `isAllowedLabOrigin(url)` | Returns `true` only when `new URL(url).origin` is in the list. Returns `false` for an invalid URL. | `lib/lab-origins.ts:4` to `lib/lab-origins.ts:11` |
| CSP link | `frame-src` is built from the same list (`lib/csp.ts:14`). | `lib/csp.ts:14` |

The iframe is rendered with `sandbox="allow-scripts allow-same-origin"` (`components/lab/LabFrame.tsx:8`).

## Related

- [Security explanation](../explanation/security.md) for why content is validated this way.
- [Architecture explanation](../explanation/architecture.md) for the content model.
