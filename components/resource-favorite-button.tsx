"use client";

import { useEffect, useMemo, useState } from "react";
import { type FavoriteResourceItem, readLaterItemKey, readLaterLoadItems, readLaterSaveItems } from "@/lib/read-later";

type ResourceFavoriteButtonProps = {
  resource: {
    id: number;
    title: string;
    url: string;
    description: string;
  };
};

export default function ResourceFavoriteButton({ resource }: ResourceFavoriteButtonProps) {
  const item: FavoriteResourceItem = useMemo(
    () => ({
      kind: "resource",
      id: resource.id,
      url: resource.url,
      title: resource.title,
      excerpt: resource.description,
      date: new Date().toISOString().slice(0, 10)
    }),
    [resource.description, resource.id, resource.title, resource.url]
  );

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const items = readLaterLoadItems();
    const currentKey = readLaterItemKey(item);
    setSaved(items.some((entry) => readLaterItemKey(entry) === currentKey));
  }, [item]);

  const label = saved ? "Убрать из избранного" : "В избранное";

  const onToggle = () => {
    const items = readLaterLoadItems();
    const currentKey = readLaterItemKey(item);
    const exists = items.some((entry) => readLaterItemKey(entry) === currentKey);
    if (exists) {
      readLaterSaveItems(items.filter((entry) => readLaterItemKey(entry) !== currentKey));
      setSaved(false);
      return;
    }
    readLaterSaveItems([item, ...items.filter((entry) => readLaterItemKey(entry) !== currentKey)].slice(0, 80));
    setSaved(true);
  };

  return (
    <button type="button" className={`resource-favorite-btn${saved ? " active" : ""}`} onClick={onToggle} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
      </svg>
      <span>{saved ? "В избранном" : "Избранное"}</span>
    </button>
  );
}
