# How to regenerate the figure

Use this guide when the hero figure needs a new photo or new build settings. You end up with a new `public/figure/bust.bin` and a matching `public/posters/figure.webp`. For the file format and the build rules, see the [figure format reference](../reference/figure-format.md).

## Before you start

- You need macOS with the Xcode command line tools, because the mask step uses Apple Vision.
- You need Python 3.12 with `numpy` and `Pillow`.
- You need a front-facing bust photo: square, with the shoulders reaching the bottom edge.

The photo and everything made from it, except the two output files, stay out of git. Keep them in a folder that git ignores, outside `public/`. The commands below call that folder `$FIG`:

```sh
FIG=path/to/your/git-ignored/folder
git check-ignore -q "$FIG" && echo "ignored, safe to use"
```

If `git check-ignore` prints nothing, pick another folder (or add it to `.gitignore`) before you copy the photo in. Name the photo `$FIG/source.jpg`.

## Steps

1. Build the segmentation tool and write the person mask.
   ```sh
   swiftc -O scripts/figure/segment.swift -o "$FIG/segment"
   "$FIG/segment" "$FIG/source.jpg" "$FIG/mask.png"
   ```
2. Combine the photo and the mask into an RGBA cutout. The mask becomes the alpha channel.
   ```sh
   python3 -I -c "import sys; from PIL import Image; d = sys.argv[1]; im = Image.open(f'{d}/source.jpg').convert('RGB'); m = Image.open(f'{d}/mask.png').convert('L').resize(im.size); im.putalpha(m); im.save(f'{d}/cutout.png')" "$FIG"
   ```
3. Build the points, the poster and three preview renders.
   ```sh
   python3 -I scripts/figure/build-points.py \
     "$FIG/cutout.png" \
     public/figure/bust.bin \
     public/posters/figure.webp \
     --previews "$FIG/previews"
   ```
   The script stops with an error if `bust.bin` is over 250 KB or the poster is over 120 KB. Keep the default `--count 56000` and `--seed 7` unless you mean to change the figure. The same input and seed give the same bytes.

## Check the result

1. Open the previews in `$FIG/previews`:
   - `bust-0.png` should read as the person.
   - `bust-35.png` should show the face with visible depth.
   - `bust-90.png` should be a lens-shaped volume with no seam down the middle.
2. Open `public/posters/figure.webp`. It is the image visitors see before the 3D loads, and the only image on the low tier and under reduced motion.
3. Run the figure tests and look at the hero on a production build.
   ```sh
   npm test -- figure
   npm run build && npm run start
   ```
   Open `http://localhost:3000/`. The live figure should land exactly on the poster when it fades in.
4. Update the visual baselines, because the hero poster is in the hero screenshot.
   ```sh
   npx playwright test tests/e2e/visual.spec.ts --update-snapshots
   ```

## Commit

Commit only the outputs and the new baselines:

```sh
git add public/figure/bust.bin public/posters/figure.webp tests/e2e/__screenshots__
git status --short
```

Check that `git status` lists nothing from `$FIG`. The photo, the mask, the cutout and the previews never enter the repository.
