"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  READ_LATER_UPDATED_EVENT,
  type ReadLaterItem,
  readLaterItemKey,
  readLaterLoadItems,
  readLaterSaveItems
} from "@/lib/read-later";

export default function BookmarksPageList() {
  const [items, setItems] = useState<ReadLaterItem[]>([]);

  useEffect(() => {
    const load = () => setItems(readLaterLoadItems());
    load();
    window.addEventListener(READ_LATER_UPDATED_EVENT, load);
    return () => window.removeEventListener(READ_LATER_UPDATED_EVENT, load);
  }, []);

  const removeItem = (itemKey: string) => {
    const next = items.filter((item) => readLaterItemKey(item) !== itemKey);
    setItems(next);
    readLaterSaveItems(next);
  };

  if (items.length === 0) {
    return (
      <article className="panel empty-panel">
        <p>Пока нет избранного.</p>
      </article>
    );
  }

  return (
    <section className="panel read-later-panel">
      <header className="section-head section-head-compact">
        <h2>Избранное</h2>
        <p>{items.length} элементов</p>
      </header>
      <div className="read-later-list">
        {items.map((item) => (
          <article key={readLaterItemKey(item)} className="read-later-item">
            {item.kind === "post" ? (
              <Link href={`/posts/${item.slug}`}>
                <strong>{item.title}</strong>
              </Link>
            ) : (
              <a href={item.url} target="_blank" rel="noreferrer noopener">
                <strong>{item.title}</strong>
              </a>
            )}
            <p>{item.excerpt}</p>
            <button type="button" className="btn-secondary" onClick={() => removeItem(readLaterItemKey(item))}>
              Удалить
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
