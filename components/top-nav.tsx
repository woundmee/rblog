"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  READ_LATER_UPDATED_EVENT,
  type ReadLaterItem,
  readLaterItemKey,
  readLaterLoadItems,
  readLaterSaveItems
} from "@/lib/read-later";

const navItems = [
  { href: "/", label: "Статьи" },
  { href: "/resources", label: "Ресурсы" },
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
  const [shortcutHint, setShortcutHint] = useState({ mod: "Ctrl", key: "K" });
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<ReadLaterItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hideNav = pathname === "/admin/login";

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform)) {
      setShortcutHint({ mod: "⌘", key: "K" });
    }
  }, []);

  useEffect(() => {
    const load = () => setFavorites(readLaterLoadItems());
    load();
    window.addEventListener(READ_LATER_UPDATED_EVENT, load);
    return () => window.removeEventListener(READ_LATER_UPDATED_EVENT, load);
  }, []);

  useEffect(() => {
    setFavoritesOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFavoritesOpen(false);
        return;
      }
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

  const removeFavorite = (itemKey: string) => {
    const next = favorites.filter((item) => readLaterItemKey(item) !== itemKey);
    setFavorites(next);
    readLaterSaveItems(next);
  };

  if (hideNav) {
    return null;
  }

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
                placeholder="Поиск..."
                aria-label="Поиск"
              />
              <span className="search-shortcut" aria-hidden>
                <kbd className="search-shortcut-mod">{shortcutHint.mod}</kbd>
                <kbd className="search-shortcut-key">{shortcutHint.key}</kbd>
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
              className={`center-nav-link nav-icon-btn${favoritesOpen ? " active" : ""}`}
              onClick={() => setFavoritesOpen((value) => !value)}
              aria-label="Избранное"
              title="Избранное"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {favoritesOpen && (
        <div className="bookmark-overlay" onClick={() => setFavoritesOpen(false)}>
          <section className="bookmark-sheet panel" onClick={(event) => event.stopPropagation()}>
            <header className="section-head section-head-compact">
              <h2>Избранное</h2>
              <p>{favorites.length} элементов</p>
            </header>
            <div className="bookmark-sheet-list">
              {favorites.length === 0 ? (
                <p className="section-note">Пока ничего не добавлено в избранное.</p>
              ) : (
                favorites.map((item) => (
                  <article key={readLaterItemKey(item)} className="bookmark-sheet-item">
                    {item.kind === "post" ? (
                      <Link href={`/posts/${item.slug}`}>
                        <strong>{item.title}</strong>
                      </Link>
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer noopener">
                        <strong>{item.title}</strong>
                      </a>
                    )}
                    <button
                      type="button"
                      className="bookmark-remove-btn"
                      onClick={() => removeFavorite(readLaterItemKey(item))}
                    >
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
        <Link href="/resources" className={`mobile-nav-link${isActive(pathname, "/resources") ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
          <span>Ресурсы</span>
        </Link>
        <Link href="/about" className={`mobile-nav-link${isActive(pathname, "/about") ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c1.6-3.6 4-5.4 7-5.4s5.4 1.8 7 5.4" />
          </svg>
          <span>Обо мне</span>
        </Link>
        <Link href="/favorites" className={`mobile-nav-link${isActive(pathname, "/favorites") ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
          </svg>
          <span>Избранное</span>
        </Link>
      </nav>
    </>
  );
}
