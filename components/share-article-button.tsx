"use client";

import { useState } from "react";

type ShareArticleButtonProps = {
  title: string;
};

export default function ShareArticleButton({ title }: ShareArticleButtonProps) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) {
      return;
    }

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: title,
          url
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1300);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className={`article-share-btn${copied ? " copied" : ""}`}
      onClick={onShare}
      aria-label={copied ? "Ссылка скопирована" : "Поделиться"}
      title={copied ? "Ссылка скопирована" : "Поделиться"}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="18" cy="5" r="2.2" />
        <circle cx="6" cy="12" r="2.2" />
        <circle cx="18" cy="19" r="2.2" />
        <path d="M8 11l7.7-4.4M8 13l7.7 4.4" />
      </svg>
    </button>
  );
}
