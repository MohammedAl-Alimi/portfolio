"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import { HeroPoster } from "@/components/home/HeroPoster";
import { ViewSlot } from "@/components/three/ViewSlot";
import type { FigureControls } from "@/components/three/FigureCloud";
import { loadFigure, type Figure } from "@/lib/figure";
import {
  countCap,
  MIN_COUNT,
  resolveCount,
  SANDBOX_DEFAULTS,
  SANDBOX_STILL,
  type SandboxSettings,
} from "@/lib/figure-sandbox";
import { useSceneActive, useSceneStore } from "@/lib/scene-store";
import { useSlot } from "@/lib/use-slot";

// three.js loads only when the view is active, as on the home page.
const FigureCloud = dynamic(() => import("@/components/three/FigureCloud").then((m) => m.FigureCloud), {
  ssr: false,
});

const SLOT = "[data-figure-sandbox-slot]";
const FIGURE_URL = "/figure/bust.bin";
const RELOAD_MS = 150;
const UNAVAILABLE = "The live figure is off here: it needs a graphics card and motion enabled. This is a still image instead.";
const RELOAD_FAILED = "Could not load that many points. Kept the previous figure.";

interface SandboxFigureProps {
  count: number;
  controls: FigureControls;
  /** Called after each load: the point count now on screen, or null when the load failed. */
  onLoad: (count: number | null) => void;
}

/** Loads the cloud at `count` points. A new count keeps the old cloud on screen until the new one is parsed. */
function SandboxFigure({ count, controls, onLoad }: SandboxFigureProps) {
  const { size, visible } = useSlot(SLOT);
  const [figure, setFigure] = useState<Figure | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const ctrl = new AbortController();
    // The first load starts at once; slider drags wait until they pause.
    const timer = window.setTimeout(
      () => {
        void loadFigure(FIGURE_URL, { count, signal: ctrl.signal }).then((fig) => {
          if (ctrl.signal.aborted) return;
          if (!fig) {
            onLoad(null);
            return;
          }
          loaded.current = true;
          setFigure(fig);
          onLoad(fig.count);
        });
      },
      loaded.current ? RELOAD_MS : 0,
    );
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [count, onLoad]);

  if (!figure || !size || size.width === 0) return null;
  return <FigureCloud figure={figure} size={size} visible={visible} slot={SLOT} controls={controls} />;
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Text shown next to the label and read out by screen readers. */
  display: string;
  onChange: (value: number) => void;
}

function Range({ label, value, min, max, step, display, onChange }: RangeProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.12em]">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <span aria-hidden className="text-text">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer accent-text disabled:cursor-not-allowed"
      />
    </div>
  );
}

/** The home page figure with its settings on sliders. The figure itself stays in FigureCloud. */
export function FigureSandbox() {
  const active = useSceneActive();
  const tier = useSceneStore((s) => s.tier);
  const sceneFailed = useSceneStore((s) => s.failed);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  // The count on screen (null until the first figure draws) and whether the last reload failed.
  const [shownCount, setShownCount] = useState<number | null>(null);
  const [firstLoadFailed, setFirstLoadFailed] = useState(false);
  const [reloadFailed, setReloadFailed] = useState(false);
  // null means "the defaults": they follow the motion preference and the tier until the visitor moves a control.
  const [picked, setPicked] = useState<SandboxSettings | null>(null);
  const [pickedCount, setPickedCount] = useState<number | null>(null);
  const checkboxId = useId();

  const settings = picked ?? (reducedMotion ? SANDBOX_STILL : SANDBOX_DEFAULTS);
  const cap = countCap(tier);
  const count = resolveCount(pickedCount, cap);
  const controls = useMemo<FigureControls>(() => ({ ...settings }), [settings]);
  // A ref, so the callback stays stable and a first load does not trigger a second.
  const hasFigure = useRef(false);
  const handleLoad = useCallback((loadedCount: number | null) => {
    if (loadedCount !== null) {
      hasFigure.current = true;
      setShownCount(loadedCount);
      setReloadFailed(false);
    } else if (hasFigure.current) {
      // A figure is already on screen: keep it and the controls.
      setReloadFailed(true);
    } else {
      setFirstLoadFailed(true);
    }
  }, []);

  const unavailable = tier === "low" || sceneFailed || firstLoadFailed;
  const disabled = !active || firstLoadFailed;
  const set = <K extends keyof SandboxSettings>(key: K, value: SandboxSettings[K]) =>
    setPicked({ ...settings, [key]: value });
  const reset = () => {
    setPicked(null);
    setPickedCount(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div
        data-figure-sandbox-slot
        data-point-count={active && shownCount !== null ? shownCount : undefined}
        className="touch-pan-y lg:col-span-8"
      >
        <ViewSlot
          className="relative aspect-[4/5] border border-border bg-surface md:aspect-[16/10]"
          poster={<HeroPoster src="/posters/figure.webp" alt="" />}
        >
          <SandboxFigure count={count} controls={controls} onLoad={handleLoad} />
        </ViewSlot>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-4">
        {unavailable ? (
          <p role="status" className="text-muted">
            {UNAVAILABLE}
          </p>
        ) : null}
        {reloadFailed && !unavailable ? (
          <p role="status" className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {RELOAD_FAILED}
          </p>
        ) : null}
        <fieldset disabled={disabled} className="flex flex-col gap-5 disabled:opacity-50">
          <legend className="sr-only">Figure settings</legend>
          <Range
            label="Rotation speed"
            value={settings.yawSpeed}
            min={0}
            max={0.6}
            step={0.01}
            display={`${settings.yawSpeed.toFixed(2)} rad/s`}
            onChange={(v) => set("yawSpeed", v)}
          />
          <Range
            label="Point count"
            value={count}
            min={MIN_COUNT}
            max={cap}
            step={1000}
            display={`${count.toLocaleString("en")} points`}
            onChange={setPickedCount}
          />
          <Range
            label="Glitch rate"
            value={settings.glitchRate}
            min={0}
            max={3}
            step={0.1}
            display={settings.glitchRate === 0 ? "off" : `${settings.glitchRate.toFixed(1)}x`}
            onChange={(v) => set("glitchRate", v)}
          />
          <div className="flex min-h-11 items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.12em]">
            <label htmlFor={checkboxId} className="text-muted">
              Scanline
            </label>
            <input
              id={checkboxId}
              type="checkbox"
              checked={settings.scanline}
              onChange={(e) => set("scanline", e.target.checked)}
              className="size-5 cursor-pointer accent-text disabled:cursor-not-allowed"
            />
          </div>
          <Range
            label="Wind gain"
            value={settings.windGain}
            min={0}
            max={0.1}
            step={0.005}
            display={settings.windGain.toFixed(3)}
            onChange={(v) => set("windGain", v)}
          />
          <button
            type="button"
            onClick={reset}
            className="min-h-11 self-start border border-border px-5 font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-text focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)] motion-safe:transition-colors hover:bg-surface disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </fieldset>
      </div>
    </div>
  );
}
