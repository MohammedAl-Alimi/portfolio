/*
 * Layer order (z-index):
 *   nav 40, dialog 50, overlays 60, future transition overlay 70.
 * The overlays sit above the mobile menu dialog so they cover every surface.
 * They never take clicks (pointer-events none).
 * On the mid tier the scanlines and the grain are hidden by CSS. The vignette stays.
 */
export function Overlays() {
  return (
    <div aria-hidden="true" data-overlay className="pointer-events-none fixed inset-0 z-[60]">
      <div
        data-overlay-scanlines
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 2px)",
        }}
      />
      <div data-overlay-grain className="absolute inset-0 opacity-[0.05] mix-blend-overlay">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>
      <div
        data-overlay-vignette
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
}
