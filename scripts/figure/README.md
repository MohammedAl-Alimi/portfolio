# Regenerate the hero figure

The hero shows a point cloud bust built from one photo. Only the derived files are in the repo:

- `public/figure/bust.bin`: the points (format below).
- `public/posters/figure.webp`: the static poster, used when there is no 3D.

The photo, the mask and the cutout never enter git. Keep them in a git-ignored folder, for example `.superpowers/figure/`.

## What you need

- macOS with Xcode command line tools, for the segmentation step.
- Python 3.12 with `numpy` and `Pillow`.

## Steps

### 1. Cut the person out of the photo

`segment.swift` uses Apple Vision person segmentation to write a mask. It is a dev tool and does not run in CI.

```sh
swiftc -O scripts/figure/segment.swift -o .superpowers/figure/segment
.superpowers/figure/segment .superpowers/figure/source.jpg .superpowers/figure/mask.png
```

Then combine the photo and the mask into an RGBA cutout (the mask becomes the alpha channel):

```sh
python3 -I -c "from PIL import Image; im = Image.open('.superpowers/figure/source.jpg').convert('RGB'); m = Image.open('.superpowers/figure/mask.png').convert('L').resize(im.size); im.putalpha(m); im.save('.superpowers/figure/cutout.png')"
```

Use a front-facing bust photo, square, with the shoulders reaching the bottom edge.

### 2. Build the points and the poster

```sh
python3 -I scripts/figure/build-points.py \
  .superpowers/figure/cutout.png \
  public/figure/bust.bin \
  public/posters/figure.webp \
  --previews .superpowers/figure/previews
```

Options:

| Option | Default | Meaning |
| --- | --- | --- |
| `--count` | `56000` | Exact number of points written. |
| `--seed` | `7` | Seed for sampling. The same input and seed give the same bytes. |
| `--previews <dir>` | off | Also writes `bust-0.png`, `bust-35.png` and `bust-90.png` (yaw in degrees). |

Check the previews before you commit. The 0° view should read as the person. The 35° view should show the face with visible depth. The 90° view should be a lens-shaped volume with no seam down the middle.

## How the points are built

1. The cutout is upscaled to 800 px (Lanczos). Alpha above 128 is the silhouette. Luminance comes from RGB and is stretched so the silhouette's 2nd to 98th percentile spans 0 to 255.
2. A 4-neighbour BFS gives each silhouette pixel its distance to the background. The bottom edge of the image does not count as background, so the cut-off shoulders stay round.
3. Depth per pixel: `t = dist / (0.55 * rowMaxDist)` clamped to 0..1, profile `sqrt(1 - (1 - t)^2)`. The maximum depth is 0.42 of the silhouette half-width. Each row is scaled by `sqrt(rowMaxDist / headMaxDist)` so the crown is a dome and the neck is thinner than the head. Below the neck (the narrowest row in the lower half) depth fades to 0.7 at the bottom row.
4. The silhouette is sampled on a jittered grid. Each sample gives a front point at `+z` (photo luminance), a back point at `-z` (0.35 times the luminance) and, with a 20% chance per sample, an interior point at a random depth (0.6 times the luminance). Interior points end up about 9% of all points. The grid step comes from the silhouette area, then a seeded trim or pad gives exactly `--count` points.
5. Coordinates are centred and scaled so the figure is 1.9 units tall, unless that would make it wider than 1.98 units, in which case the width sets the scale. Every value stays inside -1..1.

The poster is the front view: grey 3 px squares on `#050505` at 1600 by 1200, painted back to front. Brightness uses the photo luminance `l` (0 to 1, after the percentile stretch): front shell `0.12 + 0.88 * l` with no depth dimming, back shell `0.08 + 0.30 * l`, interior `0.10 + 0.50 * l`. Back and interior points are also dimmed with depth. It is encoded as WebP both lossy (quality 80, method 6) and lossless, and the smaller file is kept. Sparse dots on black compress far better lossless.

## Brightness in renderers

The stored luminance is already stretched so the silhouette uses the full 0 to 255 range. Front points carry the photo value, back points 0.35 times it, interior points 0.6 times it.

Renderers should keep that contrast, as the poster does: `brightness = 0.12 + 0.88 * lum / 255` on the front shell. The small floor keeps dark hair and a dark shirt just visible on black while skin stays bright, so the eyes and brows read. A high floor (for example 0.55) lifts hair and shirt to the same grey as the skin and washes the face out. Keep back-facing points dimmer than the front.

## Binary format `MA01`

All numbers are little-endian.

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

The file length must be exactly `8 + count * 4`. `lib/figure.ts` reads it: `parseFigure` rejects a bad magic, a count of 0 or a wrong length, `subsample` picks a seeded subset for lower tiers, and `loadFigure` fetches it and returns `null` on any failure.

## Limits

| File | Limit | At 56,000 points |
| --- | --- | --- |
| `bust.bin` | 250 KB | 224,008 bytes |
| `figure.webp` | 120 KB | about 31 KB |

The build script exits with an error if either file is over its limit.
