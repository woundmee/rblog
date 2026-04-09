"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PostMeta } from "@/lib/posts";

type PostsInfiniteListProps = {
  initialItems: PostMeta[];
  initialPage: number;
  pageSize: number;
  initialHasMore: boolean;
  query?: string;
  emptyMessage: string;
};

type PostsApiResponse = {
  items: PostMeta[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const makePostsUrl = (params: { page: number; pageSize: number; q?: string }): string => {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  if (params.q && params.q.trim().length > 0) {
    search.set("q", params.q.trim());
  }
  return `/api/posts?${search.toString()}`;
};

export default function PostsInfiniteList({
  initialItems,
  initialPage,
  pageSize,
  initialHasMore,
  query,
  emptyMessage
}: PostsInfiniteListProps) {
  const [items, setItems] = useState<PostMeta[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        makePostsUrl({
          page: page + 1,
          pageSize,
          q: query
        }),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось загрузить следующую страницу статей.");
      }

      const payload = (await response.json()) as PostsApiResponse;
      setItems((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const nextItems = payload.items.filter((item) => !known.has(item.id));
        return [...prev, ...nextItems];
      });
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Ошибка загрузки.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page, pageSize, query]);

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      {
        rootMargin: "240px 0px"
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (items.length === 0) {
    return (
      <div className="post-list">
        <article className="panel empty-panel">
          <p>{emptyMessage}</p>
        </article>
      </div>
    );
  }

  return (
    <>
      <div className="post-list">
        {items.map((post) => (
          <Link key={post.id} href={`/posts/${post.slug}`} className="panel post-card">
            <div className="post-card-meta">
              <span className="post-card-meta-item" title="Дата публикации">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M8 3v4M16 3v4M4 10h16" />
                </svg>
                <span>{new Date(post.date).toLocaleDateString("ru-RU")}</span>
              </span>
              <span className="post-card-meta-item" title="Время чтения">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v4l3 2" />
                </svg>
                <span>{post.readingTimeMinutes} мин</span>
              </span>
              <span className="post-card-meta-item" title="Уникальные просмотры">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                <span>{post.uniqueViews}</span>
              </span>
            </div>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </Link>
        ))}
      </div>

      <div className="list-progress-controls">
        {error && <p className="text-error">{error}</p>}
        {isLoading && <p className="section-note">Загрузка...</p>}
        {hasMore && (
          <button type="button" className="btn-secondary list-load-more" onClick={() => void loadMore()}>
            Показать еще
          </button>
        )}
        <div ref={sentinelRef} className="list-scroll-sentinel" aria-hidden="true" />
      </div>
    </>
  );
}
