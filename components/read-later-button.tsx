"use client";

import { useEffect, useMemo, useState } from "react";
import { type ReadLaterItem, readLaterLoadItems, readLaterSaveItems } from "@/lib/read-later";

type ReadLaterButtonProps = {
  post: ReadLaterItem;
};

export default function ReadLaterButton({ post }: ReadLaterButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const items = readLaterLoadItems();
    setSaved(items.some((item) => item.id === post.id));
  }, [post.id]);

  const buttonLabel = useMemo(() => (saved ? "Убрать из закладок" : "Читать позже"), [saved]);

  const onToggle = () => {
    const items = readLaterLoadItems();
    const exists = items.some((item) => item.id === post.id);
    if (exists) {
      readLaterSaveItems(items.filter((item) => item.id !== post.id));
      setSaved(false);
      return;
    }
    const next = [post, ...items.filter((item) => item.id !== post.id)].slice(0, 50);
    readLaterSaveItems(next);
    setSaved(true);
  };

  return (
    <button type="button" className={`article-bookmark-btn${saved ? " active" : ""}`} onClick={onToggle}>
      {buttonLabel}
    </button>
  );
}
