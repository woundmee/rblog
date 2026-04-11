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

function NotificationBellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden suppressHydrationWarning>
      <path d="M12 4a4 4 0 00-4 4v2.5c0 1.8-.7 3.5-2 4.8l-.8.8h13.6l-.8-.8a6.8 6.8 0 01-2-4.8V8a4 4 0 00-4-4z" />
      <path d="M9.5 18a2.5 2.5 0 005 0" />
    </svg>
  );
}

type CommentNotificationItem = {
  id: number;
  postId: number;
  postSlug: string;
  postTitle: string;
  parentId: number;
  parentAuthorLabel: string;
  authorLabel: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

type CommentNotificationsResponse = {
  items: CommentNotificationItem[];
  unreadCount: number;
};

const formatNotificationDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

const navItems = [
  { href: "/", label: "Главная" },
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CommentNotificationItem[]>([]);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
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
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFavoritesOpen(false);
        setNotificationsOpen(false);
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

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch("/api/notifications/comments", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as CommentNotificationsResponse;
      setNotifications(data.items ?? []);
      setNotificationsUnread(data.unreadCount ?? 0);
    } catch {
      // ignore
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markNotificationsRead = async () => {
    try {
      const response = await fetch("/api/notifications/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true })
      });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as CommentNotificationsResponse & { ok?: boolean };
      setNotifications(data.items ?? []);
      setNotificationsUnread(data.unreadCount ?? 0);
    } catch {
      // ignore
    }
  };

  const toggleNotifications = async () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    setFavoritesOpen(false);
    if (!next) {
      return;
    }
    await loadNotifications();
    await markNotificationsRead();
  };

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

          <button
            type="button"
            className={`mobile-top-notifications${notificationsOpen ? " active" : ""}`}
            onClick={() => void toggleNotifications()}
            aria-label="Уведомления"
            title="Уведомления"
          >
            <NotificationBellIcon />
            {notificationsUnread > 0 ? (
              <span className="mobile-top-notifications-badge">{notificationsUnread > 9 ? "9+" : notificationsUnread}</span>
            ) : null}
          </button>

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
              className={`center-nav-link nav-icon-btn nav-favorites-btn${favoritesOpen ? " active" : ""}`}
              onClick={() => {
                setFavoritesOpen((value) => {
                  const next = !value;
                  if (next) {
                    setNotificationsOpen(false);
                  }
                  return next;
                });
              }}
              aria-label="Избранное"
              title="Избранное"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
              </svg>
            </button>
            <button
              type="button"
              className={`center-nav-link nav-icon-btn nav-notifications-btn${notificationsOpen ? " active" : ""}`}
              onClick={() => void toggleNotifications()}
              aria-label="Уведомления"
              title="Уведомления"
            >
              <NotificationBellIcon />
              {notificationsUnread > 0 ? (
                <span className="nav-notifications-badge">{notificationsUnread > 9 ? "9+" : notificationsUnread}</span>
              ) : null}
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

      {notificationsOpen && (
        <div className="bookmark-overlay" onClick={() => setNotificationsOpen(false)}>
          <section className="bookmark-sheet panel" onClick={(event) => event.stopPropagation()}>
            <header className="section-head section-head-compact">
              <h2>Уведомления</h2>
              <p>{notificationsUnread} новых</p>
            </header>
            <div className="bookmark-sheet-list">
              {notificationsLoading ? (
                <p className="section-note">Загрузка...</p>
              ) : notifications.length === 0 ? (
                <p className="section-note">Пока уведомлений нет.</p>
              ) : (
                notifications.map((item) => (
                  <article key={item.id} className={`notification-item${item.isRead ? "" : " unread"}`}>
                    <Link href={`/posts/${item.postSlug}#comment-${item.id}`} onClick={() => setNotificationsOpen(false)}>
                      <strong>{item.authorLabel} ответил(а) на твой комментарий</strong>
                      <span>{item.postTitle}</span>
                      <p>{item.content}</p>
                      <time>{formatNotificationDate(item.createdAt)}</time>
                    </Link>
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
          <span>Главная</span>
        </Link>
        <Link href="/resources" className={`mobile-nav-link${isActive(pathname, "/resources") ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
          <span>Ресурсы</span>
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
