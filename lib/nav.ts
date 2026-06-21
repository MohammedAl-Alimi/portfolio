export type NavLabel = "HOME" | "WORK" | "LAB" | "ABOUT" | "CONTACT";
export type NavIcon = "home" | "work" | "lab" | "about" | "contact";

export const NAV_ITEMS = [
  { label: "HOME", href: "/", icon: "home" },
  { label: "WORK", href: "/projects", icon: "work" },
  { label: "LAB", href: "/lab", icon: "lab" },
  { label: "ABOUT", href: "/about", icon: "about" },
  { label: "CONTACT", href: "/contact", icon: "contact" },
] as const satisfies readonly { label: NavLabel; href: string; icon: NavIcon }[];
