import type { Metadata } from "next";
import { headers } from "next/headers";
import { Rail } from "@/components/nav/Rail";
import { TabBar } from "@/components/nav/TabBar";
import { CanvasRootLoader } from "@/components/three/CanvasRootLoader";
import { Footer } from "@/components/ui/Footer";
import { Overlays } from "@/components/ui/Overlays";
import { getProfile } from "@/lib/content";
import { display, mono } from "@/lib/fonts";
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
  // Reading request headers keeps rendering dynamic, so Next can apply the CSP nonce to its scripts.
  await headers();
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-text focus:px-4 focus:py-3 focus:text-bg focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)]"
        >
          Skip to content
        </a>
        <Rail />
        <TabBar />
        <CanvasRootLoader />
        <div className="pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[72px]">
          <main id="main" tabIndex={-1} className="min-h-dvh outline-none">
            {children}
          </main>
          <Footer />
        </div>
        <Overlays />
      </body>
    </html>
  );
}
