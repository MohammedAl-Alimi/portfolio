export type NavLabel = "Home" | "Projects" | "Lab" | "About" | "Contact";

export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Lab", href: "/lab" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "#contact" },
] as const satisfies readonly { label: NavLabel; href: string }[];
