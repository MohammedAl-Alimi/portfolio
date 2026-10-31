type IconProps = { size?: number };

const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

export function SunIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...common}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...common}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function SearchIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...common}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function MenuIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...common}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...common}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
