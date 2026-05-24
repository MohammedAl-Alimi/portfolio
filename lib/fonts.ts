import { Silkscreen } from "next/font/google";
import localFont from "next/font/local";

export const display = localFont({
  src: [
    { path: "../public/fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display-src",
  display: "swap",
  preload: true,
});

export const sans = localFont({
  src: [
    { path: "../public/fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-sans-src",
  display: "swap",
});

export const pixel = Silkscreen({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel-src",
  display: "swap",
});
