"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type RelatedPostCard = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  dateLabel: string;
  readingTimeMinutes: number;
};

type RelatedPostsSliderProps = {
  items: RelatedPostCard[];
};

export default function RelatedPostsSlider({ items }: RelatedPostsSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanPrev(track.scrollLeft > 2);
    setCanNext(track.scrollLeft < maxLeft - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    updateControls();
    const onScroll = () => updateControls();
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateControls);

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateControls);
    };
  }, [updateControls]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.scrollBy({
      left: Math.round(track.clientWidth * 0.82) * direction,
      behavior: "smooth"
    });
  };

  return (
    <div className="article-related-slider">
      <button
        type="button"
        className="article-related-arrow article-related-arrow-left"
        onClick={() => move(-1)}
        aria-label="Прокрутить похожие статьи влево"
        disabled={!canPrev}
      >
        <svg viewBox="0 0 16 16" aria-hidden>
          <path d="M9.8 3.3L5.1 8l4.7 4.7" />
        </svg>
      </button>

      <div ref={trackRef} className="article-related-grid article-related-track">
        {items.map((item) => (
          <Link key={item.id} href={`/posts/${item.slug}`} className="article-related-card">
            <h3>{item.title}</h3>
            <p>{item.excerpt}</p>
            <span>
              {item.dateLabel} · {item.readingTimeMinutes} мин
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="article-related-arrow article-related-arrow-right"
        onClick={() => move(1)}
        aria-label="Прокрутить похожие статьи вправо"
        disabled={!canNext}
      >
        <svg viewBox="0 0 16 16" aria-hidden>
          <path d="M6.2 3.3L10.9 8l-4.7 4.7" />
        </svg>
      </button>
    </div>
  );
}
