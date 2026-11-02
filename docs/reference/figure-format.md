# Figure format reference

This page describes the files that hold the hero figure: the point binary, the poster, how the build script derives them and the limits it enforces. To rebuild them, see [How to regenerate the figure](../how-to/regenerate-the-figure.md).

## Files

| File | What it is | Read by |
| --- | --- | --- |
| `public/figure/bust.bin` | The points, format `MA01` | `lib/figure.ts:29` (`parseFigure`), `lib/figure.ts:91` (`loadFigure`) |
| `public/posters/figure.webp` | The front view, painted from the same points | `components/home/Hero.tsx:45`, `components/three/StaticField.tsx:63` |

The source photo, the mask and the cutout are never committed.

## Binary format `MA01`

All numbers are little-endian (`lib/figure.ts:4` to `lib/figure.ts:7`).

| Offset | Size | Field |
| --- | --- | --- |
| 0 | 4 | Magic, ASCII `MA01` |
| 4 | 4 | `count`, uint32 |
| 8 | `count * 4` | Records |

Each record is 4 bytes:

| Byte | Type | Field |
| --- | --- | --- |
| 0 | int8 | x, `round(x * 127)` |
| 1 | int8 | y, `round(y * 127)`, up is positive |
| 2 | int8 | z, `round(z * 127)`, towards the viewer is positive |
| 3 | uint8 | luminance, 0 to 255 |

The file length must be exactly `8 + count * 4`. `parseFigure` rejects a bad magic, a count of 0 or a wrong length. `subsample` picks a seeded subset for lower tiers (`lib/figure.ts:58`). `loadFigure` fetches the file and returns `null` on any failure.

## Build constants

`scripts/figure/build-points.py` derives the points from an RGBA cutout. Its constants are at `scripts/figure/build-points.py:22` to `scripts/figure/build-points.py:41`.

| Step | Rule |
| --- | --- |
| Input | The cutout is upscaled to 800 px (Lanczos). Alpha above 128 is the silhouette. Luminance is stretched so the silhouette's 2nd to 98th percentile spans 0 to 255. |
| Distance | A 4-neighbour BFS gives each silhouette pixel its distance to the background. The bottom edge does not count as background, so the cut-off shoulders stay round (`scripts/figure/build-points.py:59`). |
| Depth | `t = dist / (0.55 * rowMaxDist)`, clamped to 0..1, profile `sqrt(1 - (1 - t)^2)`. Maximum depth is 0.42 of the silhouette half-width. Each row is scaled by `sqrt(rowMaxDist / headMaxDist)`. Below the neck, depth fades to 0.7 at the bottom row (`scripts/figure/build-points.py:88`). |
| Sampling | A jittered grid. Each sample gives a front point at `+z` (photo luminance) and a back point at `-z` (0.35 times the luminance). With a 20% chance, it also gives an interior point at a random depth (0.6 times the luminance). A seeded trim or pad gives exactly `--count` points (`scripts/figure/build-points.py:126`). |
| Scale | Centred, 1.9 units tall, never wider than 1.98 units. Every value stays inside -1..1 (`scripts/figure/build-points.py:168`). |

| Option | Default | Meaning |
| --- | --- | --- |
| `--count` | `56000` | Exact number of points written. |
| `--seed` | `7` | Sampling seed. The same input and seed give the same bytes. |
| `--previews <dir>` | off | Also writes `bust-0.png`, `bust-35.png` and `bust-90.png` (yaw in degrees). |

## Poster

The poster is the front view: grey 3 px squares on `#050505` at 1600 by 1200, painted back to front (`scripts/figure/build-points.py:191`). It is encoded as WebP twice, lossy (quality 80, method 6) and lossless, and the smaller file is kept (`scripts/figure/build-points.py:232`). Sparse dots on black compress far better lossless.

## Brightness

| Points | Brightness, with `l = lum / 255` |
| --- | --- |
| Front shell | `0.12 + 0.88 * l`, no depth dimming |
| Back shell | `0.08 + 0.30 * l`, dimmed with depth |
| Interior | `0.10 + 0.50 * l`, dimmed with depth |

The live shader uses the same rule (`components/three/shaders/figure.ts:99`). The low floor keeps dark hair and a dark shirt just visible on black while skin stays bright. A high floor (for example 0.55) lifts hair and shirt to the grey of the skin and washes the face out.

## Limits

The build script exits with an error if either file is over its limit (`scripts/figure/build-points.py:270`, `scripts/figure/build-points.py:291`).

| File | Limit | Committed size |
| --- | --- | --- |
| `bust.bin` | 250 KB | 224,008 bytes (56,000 points) |
| `figure.webp` | 120 KB | about 35 KB |
