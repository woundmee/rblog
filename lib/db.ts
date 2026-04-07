import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const dbPath = path.join(process.cwd(), "rblog.db");
const postsDir = path.join(process.cwd(), "content", "posts");
const defaultAboutTitle = "About";
const defaultWhoTitle = "Кто я";
const defaultAboutSection = "Коротко о блоге и о чем здесь публикуются материалы.";
const defaultWhoSection = "Расскажи здесь, кто ты, чем занимаешься и чем можешь быть полезен.";

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    get: (...params: unknown[]) => unknown;
    all: (...params: unknown[]) => unknown[];
    run: (...params: unknown[]) => unknown;
  };
  pragma: (value: string) => void;
};

let dbInstance: SqliteDatabase | null = null;

const loadBetterSqlite = (): new (filename: string) => SqliteDatabase => {
  try {
    const req = eval("require") as (name: string) => unknown;
    const mod = req("better-sqlite3") as { default?: unknown };
    const databaseCtor = (mod.default ?? mod) as new (filename: string) => SqliteDatabase;
    return databaseCtor;
  } catch {
    throw new Error(
      "Missing dependency: better-sqlite3. Run `npm install` in project root to install SQLite driver."
    );
  }
};

const estimateReadingExcerpt = (content: string): string => content.replace(/\s+/g, " ").trim().slice(0, 180);

const parseTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);
};

const initSchema = (db: SqliteDatabase) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      tags TEXT NOT NULL DEFAULT '[]',
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

    CREATE TABLE IF NOT EXISTS site_content (
      section_key TEXT PRIMARY KEY,
      section_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      visitor_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON post_views(viewed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_post_views_visitor_id ON post_views(visitor_id);

    CREATE TABLE IF NOT EXISTS post_reactions (
      post_id INTEGER NOT NULL,
      visitor_id TEXT NOT NULL,
      emoji TEXT,
      rating INTEGER,
      reacted_at TEXT NOT NULL,
      PRIMARY KEY(post_id, visitor_id),
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_reacted_at ON post_reactions(reacted_at DESC);

    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      key TEXT PRIMARY KEY,
      fail_count INTEGER NOT NULL,
      window_started_at INTEGER NOT NULL,
      locked_until INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_updated_at ON admin_login_attempts(updated_at DESC);

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_resources_updated_at ON resources(updated_at DESC);
  `);
};

const seedSiteContent = (db: SqliteDatabase) => {
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT OR IGNORE INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
    `
  ).run("about_title", defaultAboutTitle, now);
  db.prepare(
    `
      INSERT OR IGNORE INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
    `
  ).run("who_i_am_title", defaultWhoTitle, now);
  db.prepare(
    `
      INSERT OR IGNORE INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
    `
  ).run("about", defaultAboutSection, now);
  db.prepare(
    `
      INSERT OR IGNORE INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
    `
  ).run("who_i_am", defaultWhoSection, now);
};

const migrateMarkdownIfNeeded = (db: SqliteDatabase) => {
  const row = db.prepare("SELECT COUNT(*) as count FROM posts").get() as { count: number };
  if (row.count > 0) {
    return;
  }
  if (!fs.existsSync(postsDir)) {
    return;
  }

  const files = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"));

  if (files.length === 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO posts (slug, title, excerpt, content, category, tags, published_at, created_at, updated_at)
    VALUES (@slug, @title, @excerpt, @content, @category, @tags, @publishedAt, @createdAt, @updatedAt)
  `);

  const now = new Date().toISOString();

  for (const file of files) {
    const filePath = path.join(postsDir, file.name);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const slug = file.name.replace(/\.md$/, "").toLowerCase();
    const title = typeof parsed.data.title === "string" ? parsed.data.title : slug;
    const excerpt =
      typeof parsed.data.excerpt === "string" && parsed.data.excerpt.trim().length > 0
        ? parsed.data.excerpt
        : estimateReadingExcerpt(parsed.content);
    const publishedAt =
      typeof parsed.data.date === "string" && parsed.data.date.trim().length > 0
        ? parsed.data.date
        : now.slice(0, 10);
    const category =
      typeof parsed.data.category === "string" && parsed.data.category.trim().length > 0
        ? parsed.data.category.trim().toLowerCase()
        : "general";
    const tags = JSON.stringify(parseTags(parsed.data.tags));

    insert.run({
      slug,
      title,
      excerpt,
      content: parsed.content,
      category,
      tags,
      publishedAt,
      createdAt: now,
      updatedAt: now
    });
  }
};

export const getDb = (): SqliteDatabase => {
  if (!dbInstance) {
    const DatabaseCtor = loadBetterSqlite();
    dbInstance = new DatabaseCtor(dbPath);
    dbInstance.pragma("journal_mode = WAL");
    initSchema(dbInstance);
    seedSiteContent(dbInstance);
    migrateMarkdownIfNeeded(dbInstance);
  }
  return dbInstance;
};
