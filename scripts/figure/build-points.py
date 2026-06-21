#!/usr/bin/env python3
"""Build the hero figure point cloud from a person cutout.

Usage:
  python3 -I scripts/figure/build-points.py <cutout.png> <out.bin> <poster.webp>
      [--count 56000] [--seed 7] [--previews <dir>]

Needs numpy and Pillow only. The input photo never enters the repo; only the
derived binary and the poster are committed. See scripts/figure/README.md.
"""

import argparse
import io
import struct
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

WORK_SIZE = 800          # the cutout is upscaled to this many pixels on its long side
ALPHA_CUTOFF = 128       # alpha above this is the silhouette
LUM_LOW_PCT = 2          # luminance stretch: this percentile maps to 0
LUM_HIGH_PCT = 98        # and this one to 255
PROFILE_REACH = 0.55     # t = dist / (PROFILE_REACH * rowMaxDist)
DEPTH_RATIO = 0.42       # max depth as a fraction of the silhouette half-width
BOTTOM_FALLOFF = 0.7     # depth multiplier at the bottom row (1.0 above the neck)
INTERIOR_CHANCE = 0.2    # chance that a sample also emits an interior point
BACK_LUM = 0.35
INTERIOR_LUM = 0.6
HEIGHT_UNITS = 1.9       # the figure's height in normalised units
WIDTH_LIMIT = 1.98       # never wider than this, so x stays inside -1..1
MAGIC = b"MA01"
BIN_CAP = 250 * 1024
POSTER_CAP = 120 * 1024
POSTER_SIZE = (1600, 1200)
POSTER_BG = (5, 5, 5)    # #050505
POINT_PX = 3             # square size at 1600 px width
RENDER_FLOOR = (0.12, 0.08, 0.10)   # front, back, interior
RENDER_GAIN = (0.88, 0.30, 0.50)


def load_cutout(path):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    scale = WORK_SIZE / max(w, h)
    img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    rgba = np.asarray(img).astype(np.float32)
    mask = rgba[..., 3] > ALPHA_CUTOFF
    lum = 0.2126 * rgba[..., 0] + 0.7152 * rgba[..., 1] + 0.0722 * rgba[..., 2]
    # Stretch the silhouette's 2nd..98th percentile to the full 0..255 range.
    # A dark shirt and dark hair otherwise leave the face with little contrast.
    lo, hi = np.percentile(lum[mask], [LUM_LOW_PCT, LUM_HIGH_PCT])
    lum = np.clip((lum - lo) / max(hi - lo, 1.0), 0.0, 1.0) * 255.0
    return mask, lum


def distance_to_edge(mask):
    """4-neighbour BFS distance from the background.

    The image's top, left and right borders count as background. The bottom
    border does not: the body continues below the frame, so the shoulders
    should stay round where the photo cuts them off.
    """
    h, w = mask.shape
    dist = np.full((h, w), -1, dtype=np.int32)
    queue = deque()
    for y in range(h):
        for x in range(w):
            if not mask[y, x]:
                dist[y, x] = 0
                queue.append((y, x))
            elif x == 0 or x == w - 1 or y == 0:
                dist[y, x] = 1
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        d = dist[y, x] + 1
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and dist[ny, nx] < 0:
                dist[ny, nx] = d
                queue.append((ny, nx))
    dist[~mask] = 0
    return dist.astype(np.float32)


def depth_field(mask, dist):
    """Half-depth (in pixels) of the inflated volume at every silhouette pixel."""
    h, _ = mask.shape
    rows = np.nonzero(mask.any(axis=1))[0]
    top, bottom = int(rows[0]), int(rows[-1])
    widths = mask.sum(axis=1)
    half_width = widths.max() / 2.0
    max_depth = DEPTH_RATIO * half_width

    row_max = dist.max(axis=1, keepdims=True)
    t = np.clip(dist / np.maximum(PROFILE_REACH * row_max, 1e-6), 0.0, 1.0)
    profile = np.sqrt(1.0 - (1.0 - t) ** 2)

    # A row near the crown has a tiny rowMaxDist, so the per-row profile alone
    # would put a flat wall on top of the head, and the neck would be as deep
    # as the head. Scale each row by sqrt(rowMaxDist / headMaxDist): the square
    # root turns the linear growth of rowMaxDist below the crown into a dome.
    head_rows = slice(top, top + (bottom - top) // 2)
    head_max = float(dist[head_rows].max())
    row_cap = np.sqrt(np.clip(row_max / max(head_max, 1e-6), 0.0, 1.0))

    # Neck: the narrowest row between 55% and 90% of the figure height.
    lo = top + int(0.55 * (bottom - top))
    hi = top + int(0.90 * (bottom - top))
    neck = lo + int(np.argmin(widths[lo:hi]))
    falloff = np.ones((h, 1), dtype=np.float32)
    span = max(bottom - neck, 1)
    for y in range(neck, h):
        k = min((y - neck) / span, 1.0)
        falloff[y, 0] = 1.0 + (BOTTOM_FALLOFF - 1.0) * k

    depth = max_depth * profile * row_cap * falloff
    depth[~mask] = 0
    info = {"top": top, "bottom": bottom, "neck": neck, "half_width": half_width,
            "max_depth": max_depth}
    return depth.astype(np.float32), info


def place_points(mask, lum, depth, count, rng):
    area = int(mask.sum())
    per_sample = 2.0 + INTERIOR_CHANCE
    samples_wanted = count / per_sample
    step = float(np.sqrt(area / samples_wanted))
    h, w = mask.shape

    gy, gx = np.meshgrid(np.arange(0, h, step), np.arange(0, w, step), indexing="ij")
    sx = (gx + rng.random(gx.shape) * step).ravel()
    sy = (gy + rng.random(gy.shape) * step).ravel()
    ix = np.clip(sx.astype(np.int32), 0, w - 1)
    iy = np.clip(sy.astype(np.int32), 0, h - 1)
    keep = mask[iy, ix]
    sx, sy, ix, iy = sx[keep], sy[keep], ix[keep], iy[keep]
    z = depth[iy, ix]
    l = lum[iy, ix]

    # Columns: x, y, z, stored luminance, photo luminance (for the renders).
    front = np.stack([sx, sy, z, l, l], axis=1)
    back = np.stack([sx, sy, -z, BACK_LUM * l, l], axis=1)
    pick = rng.random(len(sx)) < INTERIOR_CHANCE
    zi = (rng.random(pick.sum()) * 2.0 - 1.0) * z[pick]
    interior = np.stack([sx[pick], sy[pick], zi, INTERIOR_LUM * l[pick], l[pick]], axis=1)

    kinds = np.concatenate([np.zeros(len(front), np.int8), np.ones(len(back), np.int8),
                            np.full(len(interior), 2, np.int8)])
    pts = np.concatenate([front, back, interior])

    if len(pts) > count:
        idx = np.sort(rng.choice(len(pts), count, replace=False))
        pts, kinds = pts[idx], kinds[idx]
    elif len(pts) < count:
        # Pad with copies of random points nudged by up to half a grid step.
        extra = rng.choice(len(pts), count - len(pts), replace=True)
        pad = pts[extra].copy()
        pad[:, 0] += (rng.random(len(extra)) - 0.5) * step
        pad[:, 1] += (rng.random(len(extra)) - 0.5) * step
        pts = np.concatenate([pts, pad])
        kinds = np.concatenate([kinds, kinds[extra]])
    return pts, kinds, step


def normalise(pts, mask):
    ys, xs = np.nonzero(mask)
    cx = (xs.min() + xs.max() + 1) / 2.0
    cy = (ys.min() + ys.max() + 1) / 2.0
    height = ys.max() + 1 - ys.min()
    width = xs.max() + 1 - xs.min()
    scale = min(HEIGHT_UNITS / height, WIDTH_LIMIT / width)
    out = np.empty((len(pts), 3), dtype=np.float32)
    out[:, 0] = (pts[:, 0] - cx) * scale
    out[:, 1] = (cy - pts[:, 1]) * scale          # image y points down, ours up
    out[:, 2] = pts[:, 2] * scale
    return np.clip(out, -1.0, 1.0), scale


def encode(xyz, lum):
    q = np.clip(np.round(xyz * 127), -127, 127).astype(np.int8)
    l = np.clip(np.round(lum), 0, 255).astype(np.uint8)
    rec = np.empty((len(q), 4), dtype=np.uint8)
    rec[:, :3] = q.view(np.uint8)
    rec[:, 3] = l
    return MAGIC + struct.pack("<I", len(q)) + rec.tobytes()


def render(xyz, photo_lum, kinds, yaw_deg, size=POSTER_SIZE):
    """Orthographic view, grey squares painted back to front.

    Brightness per kind, from the photo luminance l in 0..1:
      front shell  0.12 + 0.88 * l   (no depth dimming; dark hair stays dark, skin bright)
      back shell   0.08 + 0.30 * l
      interior     0.10 + 0.50 * l
    Back and interior points are also dimmed with depth.
    """
    w, h = size
    a = np.radians(yaw_deg)
    x = xyz[:, 0] * np.cos(a) + xyz[:, 2] * np.sin(a)
    z = -xyz[:, 0] * np.sin(a) + xyz[:, 2] * np.cos(a)
    y = xyz[:, 1]
    unit = 0.47 * h                                   # 1.9 units fill ~89% of the height
    px = np.round(w / 2 + x * unit).astype(np.int32)
    py = np.round(h / 2 - y * unit).astype(np.int32)
    l = photo_lum / 255.0
    floor = np.array(RENDER_FLOOR)[kinds]
    gain = np.array(RENDER_GAIN)[kinds]
    depth = np.where(kinds == 0, 1.0, 0.6 + 0.4 * (z + 1.0) / 2.0)
    grey = (floor + gain * l) * depth * 255.0
    order = np.argsort(z, kind="stable")              # far first
    px, py, grey = px[order], py[order], grey[order]
    square = max(1, round(POINT_PX * w / POSTER_SIZE[0]))
    canvas = np.full((h, w), float(POSTER_BG[0]), dtype=np.float32)
    for dy in range(square):
        for dx in range(square):
            cx, cy = px + dx, py + dy
            ok = np.nonzero((cx >= 0) & (cx < w) & (cy >= 0) & (cy < h))[0]
            flat = cy[ok] * w + cx[ok]
            # Keep the last (nearest) point per pixel. Fancy assignment does not
            # promise an order for repeated indices, so pick them explicitly.
            rev = flat[::-1]
            _, first = np.unique(rev, return_index=True)
            winners = ok[::-1][first]
            canvas.flat[rev[first]] = grey[winners]
    g = np.clip(canvas, 0, 255).astype(np.uint8)
    return Image.fromarray(np.stack([g, g, g], axis=-1), "RGB")


def save_poster(img, path):
    """Encode lossy (quality 80, method 6) and lossless, keep the smaller file.

    Sparse 2 px dots on black are the worst case for lossy WebP: at quality 80
    the poster is several times larger than the exact lossless encoding.
    """
    candidates = []
    for opts in ({"quality": 80, "method": 6}, {"lossless": True, "quality": 100, "method": 6}):
        buf = io.BytesIO()
        img.save(buf, "WEBP", **opts)
        candidates.append((buf.tell(), buf.getvalue(), opts))
    size, data, opts = min(candidates, key=lambda c: c[0])
    Path(path).write_bytes(data)
    return "lossless" if opts.get("lossless") else "lossy q80"


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("cutout")
    ap.add_argument("out_bin")
    ap.add_argument("poster")
    ap.add_argument("--count", type=int, default=56000)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--previews", default=None)
    args = ap.parse_args(argv)
    if args.count <= 0:
        sys.exit("count must be positive")

    rng = np.random.default_rng(args.seed)
    mask, lum = load_cutout(args.cutout)
    if not mask.any():
        sys.exit("the cutout has no opaque pixels")
    dist = distance_to_edge(mask)
    depth, info = depth_field(mask, dist)
    pts, kinds, step = place_points(mask, lum, depth, args.count, rng)
    xyz, scale = normalise(pts, mask)
    lum_out = pts[:, 3]

    data = encode(xyz, lum_out)
    if len(data) > BIN_CAP:
        sys.exit(f"binary is {len(data)} bytes, over the {BIN_CAP} byte cap")
    Path(args.out_bin).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out_bin).write_bytes(data)

    # Render from the quantised values so the poster matches what ships.
    q = np.frombuffer(data, dtype=np.uint8, offset=8).reshape(-1, 4)
    qxyz = q[:, :3].view(np.int8).astype(np.float32) / 127.0
    photo_lum = pts[:, 4]

    poster = render(qxyz, photo_lum, kinds, 0)
    Path(args.poster).parent.mkdir(parents=True, exist_ok=True)
    poster_mode = save_poster(poster, args.poster)
    if args.previews:
        out = Path(args.previews)
        out.mkdir(parents=True, exist_ok=True)
        for yaw in (0, 35, 90):
            render(qxyz, photo_lum, kinds, yaw).save(out / f"bust-{yaw}.png")

    poster_size = Path(args.poster).stat().st_size
    if poster_size > POSTER_CAP:
        sys.exit(f"poster is {poster_size} bytes, over the {POSTER_CAP} byte cap")

    counts = np.bincount(kinds, minlength=3)
    print(f"points {len(xyz)} (front {counts[0]}, back {counts[1]}, interior {counts[2]})")
    print(f"grid step {step:.3f} px, scale {scale:.5f} units/px, neck row {info['neck']}, "
          f"max depth {info['max_depth']:.1f} px")
    print(f"bounds x {xyz[:,0].min():.3f}..{xyz[:,0].max():.3f} "
          f"y {xyz[:,1].min():.3f}..{xyz[:,1].max():.3f} z {xyz[:,2].min():.3f}..{xyz[:,2].max():.3f}")
    print(f"binary {len(data)} bytes, poster {poster_size} bytes ({poster_mode})")


if __name__ == "__main__":
    main(sys.argv[1:])
