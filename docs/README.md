# Documentation

This is the documentation for the portfolio site. It follows the [Diátaxis](https://diataxis.fr) method: each page has one job, and every concrete claim points at the code with a `path:line` citation. Start with the section that matches what you need right now.

Design documents: the [design spec](superpowers/specs/2026-10-31-portfolio-design.md) and the [foundation plan](superpowers/plans/2026-10-31-portfolio-foundation.md) hold the original scope and decisions.

## Tutorials

Learning-oriented lessons. Tutorials arrive with later plans. There are none yet.

## How-to guides

Task-oriented recipes for people who already know the basics.

- [How to run the site locally](how-to/run-locally.md): clone, install on Node 24, set environment variables, and run the dev server, tests and checks.

## Reference

Dry, complete descriptions of the machinery.

- [Project structure](reference/project-structure.md): the repository tree, npm scripts and CI jobs.
- [Content schema](reference/content-schema.md): every content field, the loaders, the validation script and the iframe allowlist.
- [Configuration](reference/configuration.md): environment variables, tool configs, security headers and the CSP, secret scanning and branch protection.
- [Design tokens](reference/design-tokens.md): colors, radii, motion, fonts and their Tailwind names.

## Explanation

Background and reasoning.

- [Architecture](explanation/architecture.md): why content is files, why server components, the planned 3D canvas, the nonce CSP and the card pattern.
- [Security](explanation/security.md): which security rules apply today, which are out of scope for now, and why.
