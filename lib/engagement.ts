import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";
import { reactionEmojiOptions } from "@/lib/reaction-options";

type ReactionEmoji = (typeof reactionEmojiOptions)[number];

type ReactionInput = {
  emoji?: string | null;
};

type ReactionRow = {
  emoji: string | null;
  reacted_at: string;
};

type EmojiCountRow = {
  emoji: string;
  count: number;
};

type AnalyticsTotalsRow = {
  total_views: number;
  unique_visitors: number;
  total_reactions: number;
};

type TopPostRow = {
  id: number;
  slug: string;
  title: string;
  views: number;
};

type DailyRow = {
  day: string;
  views: number;
};

const VIEW_DEDUP_WINDOW_MS = 1000 * 60 * 60 * 12;
const REACTION_COOLDOWN_MS = 1000 * 3;

const sanitizeEmoji = (value: string | null | undefined): ReactionEmoji | null => {
  if (!value) {
    return null;
  }
  return reactionEmojiOptions.includes(value as ReactionEmoji) ? (value as ReactionEmoji) : null;
};

const getReactionSummary = (postId: number, visitorId?: string) => {
  const db = getDb();
  const emojiRows = db
    .prepare("SELECT emoji, COUNT(*) as count FROM post_reactions WHERE post_id = ? AND emoji IS NOT NULL GROUP BY emoji")
    .all(postId) as EmojiCountRow[];

  const emojiCounts = reactionEmojiOptions.map((emoji) => {
    const found = emojiRows.find((row) => row.emoji === emoji);
    return { emoji, count: found?.count ?? 0 };
  });

  let userEmoji: ReactionEmoji | null = null;

  if (visitorId) {
    const userRow = db
      .prepare("SELECT emoji FROM post_reactions WHERE post_id = ? AND visitor_id = ? LIMIT 1")
      .get(postId, visitorId) as ReactionRow | undefined;
    userEmoji = sanitizeEmoji(userRow?.emoji);
  }

  return {
    emojiCounts,
    userEmoji
  };
};

export const recordPostView = async (postId: number, visitorId: string) => {
  const db = getDb();
  const previous = db
    .prepare("SELECT viewed_at FROM post_views WHERE post_id = ? AND visitor_id = ? ORDER BY viewed_at DESC LIMIT 1")
    .get(postId, visitorId) as { viewed_at?: string } | undefined;

  if (previous?.viewed_at) {
    const previousTs = Date.parse(previous.viewed_at);
    if (Number.isFinite(previousTs) && Date.now() - previousTs < VIEW_DEDUP_WINDOW_MS) {
      return;
    }
  }

  db.prepare("INSERT INTO post_views (post_id, visitor_id, viewed_at) VALUES (?, ?, ?)").run(postId, visitorId, new Date().toISOString());
};

export const getPostReactions = async (postId: number, visitorId?: string) => {
  noStore();
  return getReactionSummary(postId, visitorId);
};

export const upsertPostReaction = async (postId: number, visitorId: string, input: ReactionInput) => {
  const emoji = sanitizeEmoji(input.emoji);
  const db = getDb();
  const existing = db
    .prepare("SELECT emoji, reacted_at FROM post_reactions WHERE post_id = ? AND visitor_id = ? LIMIT 1")
    .get(postId, visitorId) as ReactionRow | undefined;

  if (!emoji) {
    db.prepare("DELETE FROM post_reactions WHERE post_id = ? AND visitor_id = ?").run(postId, visitorId);
    return getReactionSummary(postId, visitorId);
  }

  if (existing) {
    const existingEmoji = sanitizeEmoji(existing.emoji);
    if (existingEmoji === emoji) {
      return getReactionSummary(postId, visitorId);
    }

    const reactedAtTs = Date.parse(existing.reacted_at);
    if (Number.isFinite(reactedAtTs) && Date.now() - reactedAtTs < REACTION_COOLDOWN_MS) {
      return getReactionSummary(postId, visitorId);
    }
  }

  db.prepare(
    `
      INSERT INTO post_reactions (post_id, visitor_id, emoji, reacted_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(post_id, visitor_id) DO UPDATE SET
        emoji = excluded.emoji,
        reacted_at = excluded.reacted_at
    `
  ).run(postId, visitorId, emoji, new Date().toISOString());

  return getReactionSummary(postId, visitorId);
};

export const getAnalyticsOverview = async () => {
  noStore();
  const db = getDb();

  const totals = db
    .prepare(
      `
        SELECT
          (SELECT COUNT(*) FROM post_views) as total_views,
          (SELECT COUNT(DISTINCT visitor_id) FROM post_views) as unique_visitors,
          (SELECT COUNT(*) FROM post_reactions WHERE emoji IS NOT NULL) as total_reactions
      `
    )
    .get() as AnalyticsTotalsRow;

  const topPosts = db.prepare(
    `
      SELECT p.id, p.slug, p.title, COUNT(v.id) as views
      FROM posts p
      LEFT JOIN post_views v ON v.post_id = p.id
      GROUP BY p.id
      ORDER BY views DESC, p.published_at DESC
      LIMIT 8
    `
  ).all() as TopPostRow[];

  const daily = db.prepare(
    `
      SELECT substr(viewed_at, 1, 10) as day, COUNT(*) as views
      FROM post_views
      WHERE viewed_at >= datetime('now', '-7 day')
      GROUP BY day
      ORDER BY day ASC
    `
  ).all() as DailyRow[];

  return {
    totals: {
      totalViews: totals.total_views ?? 0,
      uniqueVisitors: totals.unique_visitors ?? 0,
      totalReactions: totals.total_reactions ?? 0
    },
    topPosts,
    daily
  };
};
