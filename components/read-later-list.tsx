"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  READ_LATER_UPDATED_EVENT,
  type ReadLaterItem,
  readLaterLoadItems,
  readLaterSaveItems
} from "@/lib/read-later";

export default function ReadLaterList() {
  const [items, setItems] = useState<ReadLaterItem[]>([]);

  useEffect(() => {
    const load = () => setItems(readLaterLoadItems());
    load();
    window.addEventListener(READ_LATER_UPDATED_EVENT, load);
    return () => window.removeEventListener(READ_LATER_UPDATED_EVENT, load);
  }, []);

  const removeItem = (id: number) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    readLaterSaveItems(next);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="panel read-later-panel">
      <header className="section-head section-head-compact">
        <h2>Читать позже</h2>
        <p>{items.length} в закладках</p>
      </header>
      <div className="read-later-list">
        {items.map((item) => (
          <article key={item.id} className="read-later-item">
            <Link href={`/posts/${item.slug}`}>
              <strong>{item.title}</strong>
            </Link>
            <p>{item.excerpt}</p>
            <button type="button" className="btn-secondary" onClick={() => removeItem(item.id)}>
              Убрать
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
