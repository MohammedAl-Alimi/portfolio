import type { NavIcon } from "@/lib/nav";

const common = {
  className: "shrink-0",
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "square" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

const paths: Record<NavIcon, React.ReactNode> = {
  home: <path d="M2 7.5 8 2l6 5.5V14H2zM6.5 14V9.5h3V14" />,
  work: <path d="M2 4h12v9H2zM5.5 4V2h5v2M2 8h12" />,
  lab: <path d="M6 2h4M7 2v4L3 13h10L9 6V2M5 10h6" />,
  about: <path d="M8 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />,
  contact: <path d="M2 3.5h12v9H2zM2 4l6 5 6-5" />,
};

export function NavGlyph({ name }: { name: NavIcon }) {
  return <svg {...common}>{paths[name]}</svg>;
}

export function RailSearchIcon() {
  return (
    <svg {...common}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  );
}
