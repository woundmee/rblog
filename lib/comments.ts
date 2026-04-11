import crypto from "node:crypto";
import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";

type DbCommentRow = {
  id: number;
  post_id: number;
  parent_id: number | null;
  visitor_id: string;
  author_label: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type DbCommentNotificationRow = {
  id: number;
  post_id: number;
  post_slug: string;
  post_title: string;
  parent_id: number;
  parent_author_label: string;
  author_label: string;
  content: string;
  created_at: string;
  is_read: number;
};

type SqlRunResult = {
  lastInsertRowid: number | bigint;
};

export type CommentItem = {
  id: number;
  postId: number;
  parentId: number | null;
  visitorId: string;
  authorLabel: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CommentNotificationItem = {
  id: number;
  postId: number;
  postSlug: string;
  postTitle: string;
  parentId: number;
  parentAuthorLabel: string;
  authorLabel: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

const COMMENT_COOLDOWN_MS = 60 * 1000;
const COMMENT_MIN_LENGTH = 2;
const COMMENT_MAX_LENGTH = 1200;

export class CommentRateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many comments");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class CommentValidationError extends Error {}

const adjectivePool = [
  "Северный",
  "Спокойный",
  "Умный",
  "Точный",
  "Быстрый",
  "Тихий",
  "Надежный",
  "Смелый",
  "Легкий",
  "Четкий"
] as const;

const nounPool = [
  "Кодер",
  "Инженер",
  "Разработчик",
  "Аналитик",
  "Тестер",
  "Архитектор",
  "Ментор",
  "Исследователь",
  "Практик",
  "Читатель"
] as const;

const toNumber = (value: number | bigint): number => Number(value);

const mapComment = (row: DbCommentRow): CommentItem => ({
  id: row.id,
  postId: row.post_id,
  parentId: row.parent_id,
  visitorId: row.visitor_id,
  authorLabel: row.author_label,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapNotification = (row: DbCommentNotificationRow): CommentNotificationItem => ({
  id: row.id,
  postId: row.post_id,
  postSlug: row.post_slug,
  postTitle: row.post_title,
  parentId: row.parent_id,
  parentAuthorLabel: row.parent_author_label,
  authorLabel: row.author_label,
  content: row.content,
  createdAt: row.created_at,
  isRead: row.is_read === 1
});

const makeStableAlias = (visitorId: string): string => {
  const hash = crypto.createHash("sha256").update(visitorId).digest();
  const adjective = adjectivePool[hash[0] % adjectivePool.length];
  const noun = nounPool[hash[1] % nounPool.length];
  const suffix = ((hash[2] << 8) | hash[3]) % 900 + 100;
  return `${adjective} ${noun} ${suffix}`;
};

const normalizeContent = (value: string): string => value.replace(/\r/g, "").trim();

export const getVisitorAlias = (visitorId: string): string => makeStableAlias(visitorId);

export const getPostComments = async (postId: number): Promise<CommentItem[]> => {
  noStore();
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT id, post_id, parent_id, visitor_id, author_label, content, created_at, updated_at
        FROM post_comments
        WHERE post_id = ?
        ORDER BY datetime(created_at) ASC, id ASC
      `
    )
    .all(postId) as DbCommentRow[];

  return rows.map(mapComment);
};

export const createPostComment = async (input: {
  postId: number;
  visitorId: string;
  content: string;
  parentId?: number | null;
}): Promise<CommentItem> => {
  const db = getDb();
  const content = normalizeContent(input.content);
  if (content.length < COMMENT_MIN_LENGTH) {
    throw new CommentValidationError("Комментарий слишком короткий.");
  }
  if (content.length > COMMENT_MAX_LENGTH) {
    throw new CommentValidationError(`Комментарий слишком длинный (максимум ${COMMENT_MAX_LENGTH} символов).`);
  }

  const nowTs = Date.now();
  const previous = db
    .prepare("SELECT created_at FROM post_comments WHERE visitor_id = ? ORDER BY datetime(created_at) DESC LIMIT 1")
    .get(input.visitorId) as { created_at?: string } | undefined;

  if (previous?.created_at) {
    const previousTs = Date.parse(previous.created_at);
    if (Number.isFinite(previousTs) && nowTs - previousTs < COMMENT_COOLDOWN_MS) {
      const retryAfterSeconds = Math.max(1, Math.ceil((COMMENT_COOLDOWN_MS - (nowTs - previousTs)) / 1000));
      throw new CommentRateLimitError(retryAfterSeconds);
    }
  }

  let parentId: number | null = null;
  if (typeof input.parentId === "number" && Number.isFinite(input.parentId)) {
    const parentRow = db
      .prepare("SELECT id, post_id FROM post_comments WHERE id = ? LIMIT 1")
      .get(input.parentId) as { id: number; post_id: number } | undefined;
    if (!parentRow || parentRow.post_id !== input.postId) {
      throw new CommentValidationError("Некорректный комментарий для ответа.");
    }
    parentId = parentRow.id;
  }

  const now = new Date(nowTs).toISOString();
  const authorLabel = makeStableAlias(input.visitorId);
  const result = db
    .prepare(
      `
        INSERT INTO post_comments (post_id, parent_id, visitor_id, author_label, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(input.postId, parentId, input.visitorId, authorLabel, content, now, now) as SqlRunResult;

  const insertedId = toNumber(result.lastInsertRowid);
  const inserted = db
    .prepare(
      `
        SELECT id, post_id, parent_id, visitor_id, author_label, content, created_at, updated_at
        FROM post_comments
        WHERE id = ? LIMIT 1
      `
    )
    .get(insertedId) as DbCommentRow | undefined;

  if (!inserted) {
    throw new Error("Failed to create comment");
  }

  return mapComment(inserted);
};

export const getCommentNotifications = async (visitorId: string): Promise<{
  items: CommentNotificationItem[];
  unreadCount: number;
}> => {
  noStore();
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT
          c.id,
          c.post_id,
          p.slug as post_slug,
          p.title as post_title,
          c.parent_id,
          parent.author_label as parent_author_label,
          c.author_label,
          c.content,
          c.created_at,
          CASE WHEN r.comment_id IS NULL THEN 0 ELSE 1 END as is_read
        FROM post_comments c
        JOIN post_comments parent ON parent.id = c.parent_id
        JOIN posts p ON p.id = c.post_id
        LEFT JOIN comment_notification_reads r
          ON r.visitor_id = ? AND r.comment_id = c.id
        WHERE parent.visitor_id = ?
          AND c.visitor_id <> ?
        ORDER BY datetime(c.created_at) DESC, c.id DESC
        LIMIT 80
      `
    )
    .all(visitorId, visitorId, visitorId) as DbCommentNotificationRow[];

  const items = rows.map(mapNotification);
  const unreadCount = items.reduce((count, item) => count + (item.isRead ? 0 : 1), 0);
  return { items, unreadCount };
};

export const markCommentNotificationsRead = async (visitorId: string, commentIds: number[]): Promise<void> => {
  if (commentIds.length === 0) {
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(
    `
      INSERT INTO comment_notification_reads (visitor_id, comment_id, read_at)
      VALUES (?, ?, ?)
      ON CONFLICT(visitor_id, comment_id) DO UPDATE SET
        read_at = excluded.read_at
    `
  );

  const ownReplyLookup = db.prepare(
    `
      SELECT c.id
      FROM post_comments c
      JOIN post_comments parent ON parent.id = c.parent_id
      WHERE c.id = ?
        AND parent.visitor_id = ?
        AND c.visitor_id <> ?
      LIMIT 1
    `
  );

  const tx = db.transaction((ids: number[]) => {
    for (const id of ids) {
      const allowed = ownReplyLookup.get(id, visitorId, visitorId) as { id: number } | undefined;
      if (!allowed) {
        continue;
      }
      insert.run(visitorId, id, now);
    }
  });

  tx(commentIds);
};
