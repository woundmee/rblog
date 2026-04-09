import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";

type DbPostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  unique_views?: number | bigint | null;
};

type DbCountRow = {
  count: number | bigint;
};

export type PostMeta = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTimeMinutes: number;
  uniqueViews: number;
  updatedAt: string;
};

export type Post = PostMeta & {
  content: string;
};

export type SidebarData = {
  recentPosts: Array<{ id: number; slug: string; title: string }>;
};

export type PaginatedPostMeta = {
  items: PostMeta[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type SqlRunResult = {
  lastInsertRowid: number | bigint;
};

type SqlChangesResult = {
  changes: number;
};

const estimateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
};

const toNumber = (value: number | bigint): number => Number(value);

const postsSelectWithViews = `
  SELECT p.*,
    COALESCE(
      (
        SELECT COUNT(DISTINCT v.visitor_id)
        FROM post_views v
        WHERE v.post_id = p.id
      ),
      0
    ) AS unique_views
  FROM posts p
`;

const commonStopWords = new Set([
  "and",
  "are",
  "for",
  "from",
  "that",
  "this",
  "with",
  "the",
  "как",
  "или",
  "для",
  "что",
  "это",
  "при",
  "над",
  "под",
  "про",
  "без",
  "все",
  "всё",
  "его",
  "она",
  "они",
  "так",
  "если",
  "где",
  "когда",
  "чтобы"
]);

const tokenize = (text: string): Set<string> => {
  const normalized = text
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-яё0-9\s-]+/gi, " ")
    .replace(/-/g, " ");

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !commonStopWords.has(token));

  return new Set(tokens);
};

const overlapCount = (left: Set<string>, right: Set<string>): number => {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  let count = 0;
  for (const token of left) {
    if (right.has(token)) {
      count += 1;
    }
  }
  return count;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const mapMeta = (row: DbPostRow): PostMeta => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  date: row.published_at,
  readingTimeMinutes: estimateReadingTime(row.content),
  uniqueViews: row.unique_views == null ? 0 : toNumber(row.unique_views),
  updatedAt: row.updated_at
});

const mapPost = (row: DbPostRow): Post => ({
  ...mapMeta(row),
  content: row.content
});

const buildPostsWhereClause = (filters?: { q?: string }): { whereSql: string; params: unknown[] } => {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters?.q && filters.q.trim().length > 0) {
    where.push("LOWER(p.title) LIKE ?");
    params.push(`%${filters.q.trim().toLocaleLowerCase("ru-RU")}%`);
  }

  return {
    whereSql: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "",
    params
  };
};

const getUniqueSlug = (title: string, excludeId?: number): string => {
  const db = getDb();
  const base = slugify(title) || `post-${Date.now()}`;
  let slug = base;
  let counter = 2;

  while (true) {
    const row = db
      .prepare("SELECT id FROM posts WHERE slug = ? LIMIT 1")
      .get(slug) as { id: number } | undefined;

    if (!row) {
      return slug;
    }

    if (excludeId && row.id === excludeId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
};

export const getAllPostsMeta = async (filters?: { q?: string }): Promise<PostMeta[]> => {
  noStore();
  const db = getDb();
  const { whereSql, params } = buildPostsWhereClause(filters);

  const query = `
    ${postsSelectWithViews}
    ${whereSql}
    ORDER BY p.published_at DESC, p.id DESC
  `;

  const rows = db.prepare(query).all(...params) as DbPostRow[];
  return rows.map(mapMeta);
};

export const getPostsMetaPage = async (options?: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedPostMeta> => {
  noStore();
  const db = getDb();
  const page = Math.max(1, Math.floor(options?.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options?.pageSize ?? 30)));
  const offset = (page - 1) * pageSize;
  const { whereSql, params } = buildPostsWhereClause(options);

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM posts p ${whereSql}`).get(...params) as DbCountRow;
  const total = toNumber(totalRow.count);

  const rows = db
    .prepare(
      `
        ${postsSelectWithViews}
        ${whereSql}
        ORDER BY p.published_at DESC, p.id DESC
        LIMIT ? OFFSET ?
      `
    )
    .all(...params, pageSize, offset) as DbPostRow[];

  return {
    items: rows.map(mapMeta),
    total,
    page,
    pageSize,
    hasMore: offset + rows.length < total
  };
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  noStore();
  const db = getDb();
  const row = db
    .prepare(
      `
        ${postsSelectWithViews}
        WHERE p.slug = ? LIMIT 1
      `
    )
    .get(slug.trim().toLowerCase()) as DbPostRow | undefined;
  if (!row) {
    return null;
  }
  return mapPost(row);
};

export const getPostById = async (id: number): Promise<Post | null> => {
  noStore();
  const db = getDb();
  const row = db
    .prepare(
      `
        ${postsSelectWithViews}
        WHERE p.id = ? LIMIT 1
      `
    )
    .get(id) as DbPostRow | undefined;
  if (!row) {
    return null;
  }
  return mapPost(row);
};

export const getAdminPosts = async (): Promise<PostMeta[]> => {
  noStore();
  const db = getDb();
  const rows = db
    .prepare(`${postsSelectWithViews} ORDER BY p.published_at DESC, p.id DESC`)
    .all() as DbPostRow[];
  return rows.map(mapMeta);
};

export const getAdminPostsPage = async (options?: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedPostMeta> => {
  noStore();
  const db = getDb();
  const page = Math.max(1, Math.floor(options?.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options?.pageSize ?? 20)));
  const offset = (page - 1) * pageSize;
  const normalizedQuery = options?.q?.trim().toLocaleLowerCase("ru-RU") ?? "";
  const params: unknown[] = [];
  const whereSql =
    normalizedQuery.length > 0
      ? (() => {
          params.push(`%${normalizedQuery}%`);
          return "WHERE LOWER(p.title) LIKE ?";
        })()
      : "";

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM posts p ${whereSql}`).get(...params) as DbCountRow;
  const total = toNumber(totalRow.count);

  const rows = db
    .prepare(
      `
        ${postsSelectWithViews}
        ${whereSql}
        ORDER BY p.published_at DESC, p.id DESC
        LIMIT ? OFFSET ?
      `
    )
    .all(...params, pageSize, offset) as DbPostRow[];

  return {
    items: rows.map(mapMeta),
    total,
    page,
    pageSize,
    hasMore: offset + rows.length < total
  };
};

export const getSidebarData = async (): Promise<SidebarData> => {
  noStore();
  const db = getDb();

  const recentRows = db
    .prepare("SELECT id, slug, title FROM posts ORDER BY published_at DESC, id DESC LIMIT 10")
    .all() as Array<{ id: number; slug: string; title: string }>;

  return {
    recentPosts: recentRows
  };
};

export const createPost = async (input: {
  title: string;
  excerpt: string;
  date?: string;
  markdown: string;
}) => {
  const db = getDb();
  const now = new Date().toISOString();
  const publishedAt = input.date && input.date.length > 0 ? input.date : now.slice(0, 10);
  const slug = getUniqueSlug(input.title);

  const result = db
    .prepare(
      `
      INSERT INTO posts (slug, title, excerpt, content, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(slug, input.title, input.excerpt, input.markdown.trim(), publishedAt, now, now) as SqlRunResult;

  return { id: Number(result.lastInsertRowid), slug };
};

export const updatePost = async (
  id: number,
  input: {
    title: string;
    excerpt: string;
    date?: string;
    markdown: string;
  }
) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM posts WHERE id = ? LIMIT 1").get(id) as DbPostRow | undefined;
  if (!existing) {
    throw new Error("Post not found");
  }

  const now = new Date().toISOString();
  const publishedAt = input.date && input.date.length > 0 ? input.date : existing.published_at;

  db.prepare(
    `
    UPDATE posts
    SET title = ?, excerpt = ?, content = ?, published_at = ?, updated_at = ?
    WHERE id = ?
  `
  ).run(input.title, input.excerpt, input.markdown.trim(), publishedAt, now, id);

  return { id, slug: existing.slug };
};

export const deletePost = async (id: number): Promise<boolean> => {
  const db = getDb();
  const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id) as SqlChangesResult;
  return result.changes > 0;
};

export const getRelatedPosts = async (postId: number, limit = 4): Promise<PostMeta[]> => {
  noStore();
  const db = getDb();
  const row = db
    .prepare(
      `
        ${postsSelectWithViews}
        WHERE p.id = ? LIMIT 1
      `
    )
    .get(postId) as DbPostRow | undefined;
  if (!row) {
    return [];
  }

  const targetTitleTokens = tokenize(row.title);
  const targetExcerptTokens = tokenize(row.excerpt);
  const targetContentTokens = tokenize(row.content);
  const targetAllTokens = tokenize(`${row.title} ${row.excerpt} ${row.content}`);

  const candidates = db
    .prepare(
      `
        ${postsSelectWithViews}
        WHERE p.id <> ?
        ORDER BY p.published_at DESC, p.id DESC
        LIMIT 120
      `
    )
    .all(postId) as DbPostRow[];

  const scored = candidates
    .map((candidate) => {
      const titleTokens = tokenize(candidate.title);
      const excerptTokens = tokenize(candidate.excerpt);
      const contentTokens = tokenize(candidate.content);
      const allTokens = tokenize(`${candidate.title} ${candidate.excerpt} ${candidate.content}`);

      const score =
        overlapCount(titleTokens, targetTitleTokens) * 5 +
        overlapCount(excerptTokens, targetExcerptTokens) * 3 +
        overlapCount(contentTokens, targetContentTokens) +
        overlapCount(allTokens, targetAllTokens);

      return {
        candidate,
        score
      };
    })
    .sort((a, b) => b.score - a.score || b.candidate.published_at.localeCompare(a.candidate.published_at));

  const related = scored
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => mapMeta(item.candidate));

  if (related.length > 0) {
    return related;
  }

  return candidates.slice(0, limit).map(mapMeta);
};
