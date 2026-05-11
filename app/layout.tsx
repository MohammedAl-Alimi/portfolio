import type { Metadata } from "next";
import { headers } from "next/headers";
import { Footer } from "@/components/ui/Footer";
import { Nav } from "@/components/ui/Nav";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { display, sans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mohammed Al-Alimi",
  description: "Interactive portfolio of Mohammed Al-Alimi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-text focus:px-4 focus:py-3 focus:text-bg"
        >
          Skip to content
        </a>
        <ThemeProvider nonce={nonce}>
          <Nav />
          <main id="main" tabIndex={-1} className="min-h-[60vh] outline-none">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
