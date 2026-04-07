"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  READ_LATER_UPDATED_EVENT,
  type ReadLaterItem,
  readLaterLoadItems,
  readLaterSaveItems
} from "@/lib/read-later";

const navItems = [
  { href: "/", label: "Статьи" },
  { href: "/about", label: "Обо мне" }
];

const isActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/posts");
  }
  return pathname.startsWith(href);
};

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [shortcutHint, setShortcutHint] = useState("Ctrl+K");
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<ReadLaterItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform)) {
      setShortcutHint("⌘K");
    }
  }, []);

  useEffect(() => {
    const load = () => setBookmarks(readLaterLoadItems());
    load();
    window.addEventListener(READ_LATER_UPDATED_EVENT, load);
    return () => window.removeEventListener(READ_LATER_UPDATED_EVENT, load);
  }, []);

  useEffect(() => {
    setBookmarksOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q.length > 0) {
      params.set("q", q);
    }
    const destination = params.size > 0 ? `/?${params.toString()}` : "/";
    router.push(destination);
    router.refresh();
  };

  const removeBookmark = (id: number) => {
    const next = bookmarks.filter((item) => item.id !== id);
    setBookmarks(next);
    readLaterSaveItems(next);
  };

  return (
    <>
      <header className="topbar-wrap">
        <div className="topbar">
          <Link href="/" className="brand-block" aria-label="На главную">
            <span className="brand-dot">&lt;/&gt;</span>
            <span className="brand-name">rblog</span>
          </Link>

          <div className="topbar-search-slot">
            <form className="top-search" onSubmit={onSearch}>
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск статей"
                aria-label="Поиск статей"
              />
              <span className="search-shortcut" aria-hidden>
                {shortcutHint}
              </span>
            </form>
          </div>

          <nav className="center-nav topbar-links" aria-label="Основные разделы">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`center-nav-link${isActive(pathname, item.href) ? " active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className={`center-nav-link nav-icon-btn${bookmarksOpen ? " active" : ""}`}
              onClick={() => setBookmarksOpen((value) => !value)}
              aria-label="Закладки"
              title="Закладки"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
              </svg>
            </button>
            <Link
              href="/admin/new"
              className={`center-nav-link nav-icon-btn${pathname.startsWith("/admin") ? " active" : ""}`}
              aria-label="Админ-панель"
              title="Админ-панель"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8.2 11V8.4A3.8 3.8 0 0112 4.6a3.8 3.8 0 013.8 3.8V11" />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {bookmarksOpen && (
        <div className="bookmark-overlay" onClick={() => setBookmarksOpen(false)}>
          <section className="bookmark-sheet panel" onClick={(event) => event.stopPropagation()}>
            <header className="section-head section-head-compact">
              <h2>Закладки</h2>
              <p>{bookmarks.length} статей</p>
            </header>
            <div className="bookmark-sheet-list">
              {bookmarks.length === 0 ? (
                <p className="section-note">Пока ничего не добавлено в «Читать позже».</p>
              ) : (
                bookmarks.map((item) => (
                  <article key={item.id} className="bookmark-sheet-item">
                    <Link href={`/posts/${item.slug}`}>
                      <strong>{item.title}</strong>
                    </Link>
                    <p>{item.excerpt}</p>
                    <button type="button" className="btn-secondary" onClick={() => removeBookmark(item.id)}>
                      Удалить
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <nav className="mobile-bottom-nav" aria-label="Мобильное меню">
        <Link href="/" className={`mobile-nav-link${isActive(pathname, "/") ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M3 10.5L12 3l9 7.5" />
            <path d="M6.5 9.5V20h11V9.5" />
          </svg>
          <span>Статьи</span>
        </Link>
        <button
          type="button"
          className={`mobile-nav-link${bookmarksOpen ? " active" : ""}`}
          onClick={() => setBookmarksOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
          </svg>
          <span>Закладки</span>
        </button>
        <Link href="/about" className={`mobile-nav-link${isActive(pathname, "/about") ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c1.6-3.6 4-5.4 7-5.4s5.4 1.8 7 5.4" />
          </svg>
          <span>Обо мне</span>
        </Link>
        <Link href="/admin/new" className={`mobile-nav-link${pathname.startsWith("/admin") ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8.2 11V8.4A3.8 3.8 0 0112 4.6a3.8 3.8 0 013.8 3.8V11" />
          </svg>
          <span>Админ</span>
        </Link>
      </nav>
    </>
  );
}
