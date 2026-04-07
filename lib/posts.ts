import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";

type DbPostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type PostMeta = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  readingTimeMinutes: number;
  updatedAt: string;
};

export type Post = PostMeta & {
  content: string;
};

export type SidebarData = {
  recentPosts: Array<{ id: number; slug: string; title: string }>;
  categories: Array<{ name: string; count: number }>;
  tags: Array<{ name: string; count: number }>;
};

type SqlRunResult = {
  lastInsertRowid: number | bigint;
};

const estimateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
};

const parseTags = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
};

const toTagJson = (tags: string[]): string => JSON.stringify(Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))));

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
  category: row.category,
  tags: parseTags(row.tags),
  readingTimeMinutes: estimateReadingTime(row.content),
  updatedAt: row.updated_at
});

const mapPost = (row: DbPostRow): Post => ({
  ...mapMeta(row),
  content: row.content
});

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

export const getAllPostsMeta = async (filters?: {
  q?: string;
  category?: string;
  tag?: string;
}): Promise<PostMeta[]> => {
  noStore();
  const db = getDb();

  const normalizedQuery = filters?.q?.trim().toLocaleLowerCase("ru-RU") ?? "";
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters?.category && filters.category.trim().length > 0) {
    where.push("category = ?");
    params.push(filters.category.trim().toLowerCase());
  }

  if (filters?.tag && filters.tag.trim().length > 0) {
    where.push("tags LIKE ?");
    params.push(`%"${filters.tag.trim().toLowerCase()}"%`);
  }

  const query = `
    SELECT *
    FROM posts
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY published_at DESC, id DESC
  `;

  const rows = db.prepare(query).all(...params) as DbPostRow[];
  const filteredRows =
    normalizedQuery.length > 0
      ? rows.filter((row) => row.title.toLocaleLowerCase("ru-RU").includes(normalizedQuery))
      : rows;

  return filteredRows.map(mapMeta);
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  noStore();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM posts WHERE slug = ? LIMIT 1")
    .get(slug.trim().toLowerCase()) as DbPostRow | undefined;
  if (!row) {
    return null;
  }
  return mapPost(row);
};

export const getPostById = async (id: number): Promise<Post | null> => {
  noStore();
  const db = getDb();
  const row = db.prepare("SELECT * FROM posts WHERE id = ? LIMIT 1").get(id) as DbPostRow | undefined;
  if (!row) {
    return null;
  }
  return mapPost(row);
};

export const getAdminPosts = async (): Promise<PostMeta[]> => {
  noStore();
  const db = getDb();
  const rows = db.prepare("SELECT * FROM posts ORDER BY published_at DESC, id DESC").all() as DbPostRow[];
  return rows.map(mapMeta);
};

export const getSidebarData = async (): Promise<SidebarData> => {
  noStore();
  const db = getDb();

  const recentRows = db
    .prepare("SELECT id, slug, title FROM posts ORDER BY published_at DESC, id DESC LIMIT 10")
    .all() as Array<{ id: number; slug: string; title: string }>;

  const categoryRows = db
    .prepare("SELECT category as name, COUNT(*) as count FROM posts GROUP BY category ORDER BY count DESC, name ASC")
    .all() as Array<{ name: string; count: number }>;

  const tagsRows = db.prepare("SELECT tags FROM posts").all() as Array<{ tags: string }>;
  const tagsCount = new Map<string, number>();
  for (const row of tagsRows) {
    for (const tag of parseTags(row.tags)) {
      tagsCount.set(tag, (tagsCount.get(tag) ?? 0) + 1);
    }
  }
  const tags = Array.from(tagsCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    recentPosts: recentRows,
    categories: categoryRows,
    tags
  };
};

export const createPost = async (input: {
  title: string;
  excerpt: string;
  date?: string;
  markdown: string;
  category?: string;
  tags?: string[];
}) => {
  const db = getDb();
  const now = new Date().toISOString();
  const publishedAt = input.date && input.date.length > 0 ? input.date : now.slice(0, 10);
  const slug = getUniqueSlug(input.title);
  const category = input.category && input.category.trim().length > 0 ? input.category.trim().toLowerCase() : "general";
  const tags = toTagJson(input.tags ?? []);

  const result = db
    .prepare(
      `
      INSERT INTO posts (slug, title, excerpt, content, category, tags, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(slug, input.title, input.excerpt, input.markdown.trim(), category, tags, publishedAt, now, now) as SqlRunResult;

  return { id: Number(result.lastInsertRowid), slug };
};

export const updatePost = async (
  id: number,
  input: {
    title: string;
    excerpt: string;
    date?: string;
    markdown: string;
    category?: string;
    tags?: string[];
  }
) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM posts WHERE id = ? LIMIT 1").get(id) as DbPostRow | undefined;
  if (!existing) {
    throw new Error("Post not found");
  }

  const now = new Date().toISOString();
  const publishedAt = input.date && input.date.length > 0 ? input.date : existing.published_at;
  const category =
    input.category && input.category.trim().length > 0 ? input.category.trim().toLowerCase() : existing.category;
  const tags = input.tags ? toTagJson(input.tags) : existing.tags;

  db.prepare(
    `
    UPDATE posts
    SET title = ?, excerpt = ?, content = ?, category = ?, tags = ?, published_at = ?, updated_at = ?
    WHERE id = ?
  `
  ).run(input.title, input.excerpt, input.markdown.trim(), category, tags, publishedAt, now, id);

  return { id, slug: existing.slug };
};
