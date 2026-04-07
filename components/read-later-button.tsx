"use client";

import { useEffect, useMemo, useState } from "react";
import { type FavoritePostItem, readLaterItemKey, readLaterLoadItems, readLaterSaveItems } from "@/lib/read-later";

type ReadLaterButtonProps = {
  post: FavoritePostItem;
};

export default function ReadLaterButton({ post }: ReadLaterButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const items = readLaterLoadItems();
    const currentKey = readLaterItemKey(post);
    setSaved(items.some((item) => readLaterItemKey(item) === currentKey));
  }, [post]);

  const buttonLabel = useMemo(() => (saved ? "Убрать из избранного" : "В избранное"), [saved]);

  const onToggle = () => {
    const items = readLaterLoadItems();
    const currentKey = readLaterItemKey(post);
    const exists = items.some((item) => readLaterItemKey(item) === currentKey);
    if (exists) {
      readLaterSaveItems(items.filter((item) => readLaterItemKey(item) !== currentKey));
      setSaved(false);
      return;
    }
    const next = [post, ...items.filter((item) => readLaterItemKey(item) !== currentKey)].slice(0, 80);
    readLaterSaveItems(next);
    setSaved(true);
  };

  return (
    <button type="button" className={`article-bookmark-btn${saved ? " active" : ""}`} onClick={onToggle}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
      </svg>
      <span>{buttonLabel}</span>
    </button>
  );
}
