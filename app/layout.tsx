import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import TopNav from "@/components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "rblog",
  description: "Минималистичный IT-блог"
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
        </div>
      </body>
    </html>
  );
}
