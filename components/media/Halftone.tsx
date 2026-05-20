"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ditherPixel, luminance } from "@/lib/halftone";
import { useSceneStore } from "@/lib/scene-store";

/** CSS px per dither cell. */
const CELL = 2;
/** The two tones of the dither: the page black and the text white. */
const DARK = [5, 5, 5] as const;
const LIGHT = [242, 242, 240] as const;

interface Props {
  src: string;
  alt?: string;
  sizes: string;
  /** Classes for the box. It must have a size (an aspect ratio, or absolute inset). */
  className?: string;
  /** "hover" fades the dither out on hover and focus of the surrounding card, showing the grey image. */
  resolve?: "hover" | "none";
}

/**
 * A cover image as a two-tone ordered dither. The base is the real image in greyscale;
 * a small canvas on top holds one pixel per 2 by 2 CSS px cell, scaled up without smoothing.
 * The canvas stays hidden until it has drawn, so a failed load or a missing 2D context
 * leaves the grey image. The low tier skips the canvas.
 */
export function Halftone({ src, alt = "", sizes, className, resolve = "hover" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tier = useSceneStore((s) => s.tier);
  const enabled = tier !== null && tier !== "low";

  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    if (!enabled || !el || !cv) return;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let source: HTMLImageElement | null = null;
    let raf = 0;
    let drawnW = 0;
    let drawnH = 0;
    let cancelled = false;

    const draw = () => {
      raf = 0;
      if (!source) return;
      const w = Math.ceil(el.clientWidth / CELL);
      const h = Math.ceil(el.clientHeight / CELL);
      if (w === 0 || h === 0 || (w === drawnW && h === drawnH)) return;
      cv.width = w;
      cv.height = h;
      // Crop like object-cover, so the dither lines up with the image under it.
      const scale = Math.max(w / source.naturalWidth, h / source.naturalHeight);
      const sw = w / scale;
      const sh = h / scale;
      ctx.drawImage(source, (source.naturalWidth - sw) / 2, (source.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
      let frame: ImageData;
      try {
        frame = ctx.getImageData(0, 0, w, h);
      } catch {
        return; // a tainted canvas cannot be read: keep the grey image
      }
      const px = frame.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const tone = ditherPixel(luminance(px[i] ?? 0, px[i + 1] ?? 0, px[i + 2] ?? 0), x, y) ? LIGHT : DARK;
          px[i] = tone[0];
          px[i + 1] = tone[1];
          px[i + 2] = tone[2];
          px[i + 3] = 255;
        }
      }
      ctx.putImageData(frame, 0, 0);
      drawnW = w;
      drawnH = h;
      cv.dataset.ready = "";
    };
    // Resize bursts draw once, on the next frame.
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const ro = new ResizeObserver(schedule);

    // Nothing loads until the box is close to the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const img = document.createElement("img");
        img.decoding = "async";
        img.onload = () => {
          if (cancelled) return;
          source = img;
          ro.observe(el);
          schedule();
        };
        img.src = src;
      },
      { rootMargin: "200px" },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      delete cv.dataset.ready;
    };
  }, [enabled, src]);

  return (
    <div ref={box} className={cn("relative overflow-hidden", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover grayscale" />
      {tier === "low" ? null : (
        <canvas
          ref={canvas}
          aria-hidden="true"
          data-halftone
          className={cn(
            "invisible absolute inset-0 h-full w-full [image-rendering:pixelated] data-[ready]:visible",
            resolve === "hover" &&
              "motion-safe:transition-opacity motion-safe:duration-[240ms] group-hover/brackets:opacity-0 group-focus-within/brackets:opacity-0",
          )}
        />
      )}
    </div>
  );
}
