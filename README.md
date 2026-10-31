# Mohammed Al-Alimi, portfolio

Interactive, colourful, 3D-forward portfolio. Built with Next.js, React Three Fiber and a lot of small commits.

> Status: design phase. The spec lives in [`docs/superpowers/specs/2026-10-31-portfolio-design.md`](docs/superpowers/specs/2026-10-31-portfolio-design.md).

## What it will be

- A hero made of floating 3D shapes, one per project. Drag them, throw them, click one to open its case study.
- Case studies for shipped work: crowd detection thesis, Noah hub, the agent security playbook, Is My App Safe, and more.
- A live "Right now" panel with GitHub activity and a LeetCode streak.
- A Lab of small experiments and live demos.
- A visible Search, plus a hidden terminal for people who go looking.

## Principles

- Everyone can navigate it with the top bar and visible buttons. The playground is a side door, never the main path.
- Fast on phones. 3D is lazy-loaded and falls back to a static image on low-end devices.
- Adding a project is one content file. No CMS, no database.
- Security and documentation follow the [agent-security-playbook](https://github.com/MohammedAl-Alimi/agent-security-playbook) and the [documentation-playbook](https://github.com/MohammedAl-Alimi/documentation-playbook).

## Docs

Full documentation will live in [`docs/`](docs/) following the Diátaxis structure once the code exists.

## License

MIT for the code. Project content, images and copy are all rights reserved.
