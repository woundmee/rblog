"use client";

import { useEffect, useRef, useState } from "react";
import { reactionEmojiOptions } from "@/lib/reaction-options";

type ReactionSummary = {
  emojiCounts: Array<{ emoji: string; count: number }>;
  userEmoji: string | null;
};

type PostEngagementProps = {
  postId: number;
};

export default function PostEngagement({ postId }: PostEngagementProps) {
  const [summary, setSummary] = useState<ReactionSummary | null>(null);
  const [pending, setPending] = useState(false);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/reactions`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { summary?: ReactionSummary };
        if (!isCancelled && data.summary) {
          setSummary(data.summary);
        }
      } catch {
        // ignore
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    if (viewTrackedRef.current) {
      return;
    }
    viewTrackedRef.current = true;

    try {
      const key = `rblog:viewed:${postId}:session`;
      if (window.sessionStorage.getItem(key)) {
        return;
      }
      window.sessionStorage.setItem(key, "1");
    } catch {
      // ignore storage errors
    }

    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => undefined);
  }, [postId]);

  const updateReaction = async (payload: { emoji?: string | null }) => {
    setPending(true);
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { summary?: ReactionSummary };
      if (data.summary) {
        setSummary(data.summary);
      }
    } finally {
      setPending(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    const nextEmoji = summary?.userEmoji === emoji ? null : emoji;
    updateReaction({ emoji: nextEmoji });
  };

  return (
    <div className="post-engagement">
      <div className="reaction-row">
        {reactionEmojiOptions.map((emoji) => {
          const count = summary?.emojiCounts.find((item) => item.emoji === emoji)?.count ?? 0;
          const active = summary?.userEmoji === emoji;
          return (
            <button
              key={emoji}
              type="button"
              className={`reaction-btn${active ? " active" : ""}`}
              onClick={() => handleEmojiClick(emoji)}
              disabled={pending}
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
