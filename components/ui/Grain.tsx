export function Grain() {
  return (
    <div
      aria-hidden="true"
      data-grain
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.06] mix-blend-overlay light:opacity-[0.04]"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
