import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import TopNav from "@/components/top-nav";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "rblog",
    template: "%s | rblog"
  },
  description: "Минималистичный IT-блог",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "rblog",
    url: siteUrl,
    title: "rblog",
    description: "Минималистичный IT-блог",
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
    description: "Минималистичный IT-блог",
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
          <main className="content-area">{children}</main>
          <footer className="site-footer" aria-label="Footer">
            <p>© {new Date().getFullYear()} rblog</p>
            <nav className="site-footer-nav" aria-label="Footer links">
              <Link href="/">Статьи</Link>
              <Link href="/resources">Ресурсы</Link>
              <Link href="/about">Обо мне</Link>
            </nav>
          </footer>
        </div>
      </body>
    </html>
  );
}
