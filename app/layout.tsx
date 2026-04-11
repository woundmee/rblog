import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import TopNav from "@/components/top-nav";
import AdBanner from "@/components/ad-banner";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "rblog",
    template: "%s | rblog"
  },
  description: "IT-блог о разработке",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "rblog",
    url: siteUrl,
    title: "rblog",
    description: "IT-блог о разработке",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "rblog"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "rblog",
    description: "IT-блог о разработке",
    images: ["/twitter-image"]
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <div className="page-shell">
          <Suspense fallback={null}>
            <TopNav />
          </Suspense>
          <Suspense fallback={null}>
            <AdBanner />
          </Suspense>
          <main className="content-area">{children}</main>
          <footer className="site-footer" aria-label="Footer">
            <p>© rblog</p>
            <nav className="site-footer-nav" aria-label="Footer links">
              <Link href="/">Главная</Link>
              <Link href="/resources">Ресурсы</Link>
              <Link href="/about">Обо мне</Link>
            </nav>
          </footer>
        </div>
      </body>
    </html>
  );
}
