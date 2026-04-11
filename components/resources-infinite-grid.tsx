"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ResourceCard from "@/components/resource-card";
import type { ResourceItem } from "@/lib/resources";

type ResourcesInfiniteGridProps = {
  initialItems: ResourceItem[];
  initialPage: number;
  pageSize: number;
  initialHasMore: boolean;
  query?: string;
  emptyMessage: string;
};

type ResourcesApiResponse = {
  items: ResourceItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const makeResourcesUrl = (params: { page: number; pageSize: number; q?: string }): string => {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  if (params.q && params.q.trim().length > 0) {
    search.set("q", params.q.trim());
  }
  return `/api/resources?${search.toString()}`;
};

export default function ResourcesInfiniteGrid({
  initialItems,
  initialPage,
  pageSize,
  initialHasMore,
  query,
  emptyMessage
}: ResourcesInfiniteGridProps) {
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setError("");
    setIsLoading(false);
  }, [initialHasMore, initialItems, initialPage, pageSize, query]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        makeResourcesUrl({
          page: page + 1,
          pageSize,
          q: query
        }),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось загрузить следующую страницу ресурсов.");
      }

      const payload = (await response.json()) as ResourcesApiResponse;
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
        rootMargin: "280px 0px"
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (items.length === 0) {
    return (
      <article className="panel empty-panel">
        <p>{emptyMessage}</p>
      </article>
    );
  }

  return (
    <>
      <div className="resources-grid">
        {items.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
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
