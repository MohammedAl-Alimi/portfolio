import type { Metadata } from "next";
import { headers } from "next/headers";
import { Footer } from "@/components/ui/Footer";
import { Grain } from "@/components/ui/Grain";
import { Nav } from "@/components/ui/Nav";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { getProfile } from "@/lib/content";
import { display, pixel, sans } from "@/lib/fonts";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: profile.headline,
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${pixel.variable}`}
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
          <Grain />
        </ThemeProvider>
      </body>
    </html>
  );
}
