import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import TopNav from "@/components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "rblog",
  description: "Минималистичный IT-блог",
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
