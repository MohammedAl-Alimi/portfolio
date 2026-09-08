import { JetBrains_Mono, Syne } from "next/font/google";

export const display = Syne({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-display-src",
  display: "swap",
  preload: true,
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono-src",
  display: "swap",
  preload: true,
});
