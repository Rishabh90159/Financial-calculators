import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@/components/layout/Analytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { isIndexable, siteConfig } from "@/lib/site";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-serif-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  formatDetection: { telephone: false, address: false, email: false },
  robots: isIndexable ? { index: true, follow: true } : { index: false, follow: false },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#f7f5ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${plex.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-brand px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
