# Security

This page explains which security rules apply to the portfolio today, which do not yet, and why. The rules come from the [agent-security-playbook](https://github.com/MohammedAl-Alimi/agent-security-playbook) and are copied into `CLAUDE.md` under "Security rules". Numbers below are those rule numbers.

## The shape of the risk

Today the site is a read-only set of pages. Visitors cannot sign in, upload, post or pay. The server reads files that the owner wrote and returns HTML. The only input from a visitor is the URL: a path, and the optional `?tag=` query on `/projects`.

That makes the risk small but not zero. What remains is mostly about the browser: someone injecting script, framing the site, or abusing a link. And about the build: a bad dependency, or a secret that slips into the repository. The protections below match that shape.

## Rules that apply today

| Rule | What it protects | How the site follows it | Where |
| --- | --- | --- | --- |
| Design spec section 10 headers (no rule number, related to 33) | Script injection, clickjacking, protocol downgrade, leaky referrers | `proxy.ts` sets a nonce CSP, HSTS, `nosniff`, a strict referrer policy, a permissions policy and `X-Frame-Options: DENY` on every page response. `poweredByHeader` is off. | `proxy.ts:22` to `proxy.ts:33`, `next.config.ts:4` |
| 5 Parse all external input through a strict schema | Malformed or hostile input | Content files are parsed with `z.strictObject`. The `?tag=` query is checked against the `TAG_NAMES` allowlist, and anything else becomes "no match". | `lib/schemas.ts:36`, `lib/filter.ts:4`, `app/projects/page.tsx:22` |
| 6 Validate env vars at boot | A silent bad configuration | `NEXT_PUBLIC_SITE_URL` must be an absolute URL or the app throws on start. The only other variables are unused for now. | `lib/site.ts:5` to `lib/site.ts:9` |
| 7 Output rendering | Cross-site scripting through links and markup | Links in MDX pass `isSafeHref`: https, mailto, same-site paths and anchors only, with no backslashes, spaces or control characters. Anything else renders as plain text. External links get `rel="noopener noreferrer"`. Images need alt text. | `components/mdx/components.tsx:7`, `components/mdx/components.tsx:47` to `components/mdx/components.tsx:61`, `components/mdx/components.tsx:64` |
| 7 Output rendering (JSON-LD) | Breaking out of a script tag | `JsonLd` is the one place that uses `dangerouslySetInnerHTML`. The data is a typed object built from our own content, and `<` is replaced with the JSON escape `\u003c` (`components/seo/JsonLd.tsx:13`). It carries the request nonce. | `components/seo/JsonLd.tsx:6` to `components/seo/JsonLd.tsx:15` |
| 29 Errors | Leaking internals | Error screens show a generic message and the request digest only. The console log holds the digest, not the error text. | `app/error.tsx:15`, `app/error.tsx:33`, `app/global-error.tsx:62` |
| 30 Secrets | A key or private string in the repo or the client bundle | `scripts/check-secrets.sh` and gitleaks run in CI. `.env` files are git-ignored. `GITHUB_TOKEN` is documented as server-only. | `.github/workflows/ci.yml:49` to `.github/workflows/ci.yml:52`, `.gitignore:17` to `.gitignore:19`, `.env.example:1` |
| 31 Dependencies | Supply chain attacks | Versions are pinned exactly in `package.json`, the lockfile is committed, CI installs with `npm ci`, and Dependabot groups updates weekly and skips major bumps of the core framework packages. | `package.json:19` to `package.json:51`, `.github/workflows/ci.yml:24`, `.github/dependabot.yml:2` to `.github/dependabot.yml:22` |
| 34 Never weaken a control | Fixing a bug by removing a protection | A working agreement for agents and for review. No code enforces it. | `CLAUDE.md` |

### Content Security Policy

The CSP uses a fresh nonce per request, with `'strict-dynamic'`, so only scripts the server stamped can run (`lib/csp.ts:4`). `frame-ancestors 'none'` stops other sites from framing this one (`lib/csp.ts:15`). `object-src 'none'` and `base-uri 'self'` close two older script routes (`lib/csp.ts:16`, `lib/csp.ts:18`). `style-src` still allows `'unsafe-inline'` because Next's fonts and inline style attributes need it (`lib/csp.ts:10`). That is a known weaker spot, accepted because styles carry far less risk than scripts. The full list is in [Configuration](../reference/configuration.md#csp-directives). The reason pages render dynamically is in [Architecture](architecture.md).

An end to end test asserts the headers on five public pages and checks that no CSP violation is logged while pages render (`tests/e2e/security.spec.ts:3` to `tests/e2e/security.spec.ts:42`).

### Content validation

Invalid content fails the build, not the visitor. `validate:content` runs before `next build` (`package.json:7`). It also checks that referenced images exist and that every iframe URL is on the allowlist (`scripts/validate-content.ts:22`, `scripts/validate-content.ts:44`).

MDX itself is written by the owner and compiled on the server. It is trusted code in the same way a React component in the repo is, and a pull request reviews it. The link rule above is a second guard in case a bad link is pasted by mistake.

### Iframes: sandbox and origin allowlist

Lab items can embed an external page. Three things limit the damage if that page misbehaves:

1. The origin must be in `LAB_FRAME_ORIGINS`, checked at build time (`lib/lab-origins.ts:2`, `scripts/validate-content.ts:44`).
2. The CSP `frame-src` lists the same origins, so the browser refuses any other frame (`lib/csp.ts:14`).
3. The iframe carries `sandbox="allow-scripts allow-same-origin"`, `referrerPolicy="no-referrer"` and `loading="lazy"` (`components/lab/LabFrame.tsx:8` to `components/lab/LabFrame.tsx:10`).

The sandbox keeps scripts and the frame's own origin, so the embedded app works. It does not allow top navigation, forms, popups or downloads. No `CLAUDE.md` rule covers iframes by number. The design is in the "Security" section of the design spec.

### Public contact for researchers

`public/.well-known/security.txt` tells researchers how to report an issue and when the file expires (`public/.well-known/security.txt:7`, `public/.well-known/security.txt:8`). A test checks that it is served (`tests/e2e/security.spec.ts:44`).

## Rules that are out of scope until a feature needs them

These rules protect features the site does not have yet. Adding the protection before the feature would be code that nothing exercises. Each one is a condition for shipping the matching feature, not an optional extra.

| Rules | Topic | Why not applicable now | What triggers it |
| --- | --- | --- | --- |
| 1, 2, 3, 4, 16 | Authentication, authorization, sessions, tokens | There are no accounts and no private data. | Adding any sign in or admin area. |
| 8, 9, 10 | Database, RLS, atomic counters | There is no database. | Adding a database table. |
| 11, 12 | Business logic state machines, one-shot actions | There are no multi-step flows. | Adding any form that changes state. |
| 13, 14, 15 | Passwords, tokens, timing-safe comparison | No credentials exist. | Adding any secret that is compared. |
| 17, 18 | Webhooks and payments | No payment or webhook endpoint. | Adding either. |
| 19, 20 | Rate limiting and SSRF | The site makes no server side request to a user supplied URL. The live data routes are planned: `CLAUDE.md` says they go through `app/api/*` with caching and rate limiting, and the client never calls GitHub or LeetCode. | Plan with the live "Right now" panel. |
| 21 | Uploads | Visitors cannot upload. | Adding a file input. |
| 22 | Caching of personalized data | Responses are the same for everyone. | Adding anything per user. |
| 23 | Email | The site only links to a `mailto:`; it sends nothing (`components/ui/Footer.tsx:13`). | Adding a contact form. |
| 24 | Realtime and postMessage | No sockets and no messaging with the iframe. | Adding either. |
| 25 | AI agents | No agent runs inside the site. | Adding an agent or tool-calling feature. |
| 26, 27, 28 | Client data, PII in logs, prod data | No client data is in the repo. The tests use small invented fixtures. Logs hold only the error digest. | Adding any real user data. |
| 32 | Paging on security events | No auth or exports to alert on. | Adding accounts or exports. |
| 35 | Negative test per endpoint | There are no authenticated endpoints. Public headers are tested. | Adding endpoints with access control. |

## Related

- [Configuration](../reference/configuration.md) for the exact headers, directives and scanner categories.
- [Architecture](architecture.md) for why the CSP shapes rendering.
