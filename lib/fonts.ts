import { Manrope, Silkscreen, Unbounded } from "next/font/google";

export const display = Unbounded({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display-src",
  display: "swap",
  preload: true,
});

export const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans-src",
  display: "swap",
});

export const pixel = Silkscreen({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel-src",
  display: "swap",
});
