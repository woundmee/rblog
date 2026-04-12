import path from "node:path";

const dbPath = path.join(process.cwd(), "rblog.db");
const defaultAboutTitle = "About";
const defaultWhoTitle = "Кто я";
const defaultAboutSection = "Коротко о блоге и о чем здесь публикуются материалы.";
const defaultWhoSection = "Расскажи здесь, кто ты, чем занимаешься и чем можешь быть полезен.";
const defaultAdEnabled = "0";
const defaultAdMarkdown = "###### Партнёрский блок\nКороткий дополнительный текст в нейтральном стиле.";

type SqliteDatabase = {
  exec: (sql: string) => void;
  transaction: <T extends (...args: never[]) => unknown>(fn: T) => T;
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

type TableInfoRow = {
  name: string;
};

const hasColumn = (db: SqliteDatabase, table: string, column: string): boolean => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as TableInfoRow[];
  return columns.some((item) => item.name === column);
};

const initSchema = (db: SqliteDatabase) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);

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
    CREATE INDEX IF NOT EXISTS idx_post_views_post_visitor_viewed_at ON post_views(post_id, visitor_id, viewed_at DESC);

    CREATE TABLE IF NOT EXISTS post_reactions (
      post_id INTEGER NOT NULL,
      visitor_id TEXT NOT NULL,
      emoji TEXT,
      reacted_at TEXT NOT NULL,
      PRIMARY KEY(post_id, visitor_id),
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_reactions_reacted_at ON post_reactions(reacted_at DESC);

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      parent_id INTEGER,
      visitor_id TEXT NOT NULL,
      author_label TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(parent_id) REFERENCES post_comments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_post_comments_visitor_id ON post_comments(visitor_id);

    CREATE TABLE IF NOT EXISTS comment_notification_reads (
      visitor_id TEXT NOT NULL,
      comment_id INTEGER NOT NULL,
      read_at TEXT NOT NULL,
      PRIMARY KEY(visitor_id, comment_id),
      FOREIGN KEY(comment_id) REFERENCES post_comments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_comment_notification_reads_visitor_id ON comment_notification_reads(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_comment_notification_reads_comment_id ON comment_notification_reads(comment_id);

    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      key TEXT PRIMARY KEY,
      fail_count INTEGER NOT NULL,
      window_started_at INTEGER NOT NULL,
      locked_until INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_updated_at ON admin_login_attempts(updated_at DESC);

    CREATE TABLE IF NOT EXISTS admin_image_upload_limits (
      key TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      upload_count INTEGER NOT NULL,
      uploaded_bytes INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_admin_image_upload_limits_updated_at ON admin_image_upload_limits(updated_at DESC);

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

    CREATE TABLE IF NOT EXISTS resource_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL,
      visitor_id TEXT NOT NULL,
      clicked_at TEXT NOT NULL,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_term TEXT,
      utm_content TEXT,
      page_path TEXT NOT NULL DEFAULT '',
      FOREIGN KEY(resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_resource_clicks_resource_id ON resource_clicks(resource_id);
    CREATE INDEX IF NOT EXISTS idx_resource_clicks_clicked_at ON resource_clicks(clicked_at DESC);
    CREATE INDEX IF NOT EXISTS idx_resource_clicks_utm_source ON resource_clicks(utm_source);
    CREATE INDEX IF NOT EXISTS idx_resource_clicks_utm_medium ON resource_clicks(utm_medium);
    CREATE INDEX IF NOT EXISTS idx_resource_clicks_utm_campaign ON resource_clicks(utm_campaign);

    -- Remove redundant indexes duplicated by unique/primary keys.
    DROP INDEX IF EXISTS idx_posts_slug;
    DROP INDEX IF EXISTS idx_posts_category;
    DROP INDEX IF EXISTS idx_post_reactions_post_id;
  `);
};

const migrateLegacySchemaIfNeeded = (db: SqliteDatabase) => {
  const needsPostsMigration = hasColumn(db, "posts", "category") || hasColumn(db, "posts", "tags");
  const needsReactionsMigration = hasColumn(db, "post_reactions", "rating");

  if (!needsPostsMigration && !needsReactionsMigration) {
    return;
  }

  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec("BEGIN");

  try {
    if (needsPostsMigration) {
      db.exec(`
        CREATE TABLE posts_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          published_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        INSERT INTO posts_new (id, slug, title, excerpt, content, published_at, created_at, updated_at)
        SELECT id, slug, title, excerpt, content, published_at, created_at, updated_at
        FROM posts;

        DROP TABLE posts;
        ALTER TABLE posts_new RENAME TO posts;
        CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
      `);
    }

    if (needsReactionsMigration) {
      db.exec(`
        CREATE TABLE post_reactions_new (
          post_id INTEGER NOT NULL,
          visitor_id TEXT NOT NULL,
          emoji TEXT,
          reacted_at TEXT NOT NULL,
          PRIMARY KEY(post_id, visitor_id),
          FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
        );

        INSERT INTO post_reactions_new (post_id, visitor_id, emoji, reacted_at)
        SELECT post_id, visitor_id, emoji, reacted_at
        FROM post_reactions;

        DROP TABLE post_reactions;
        ALTER TABLE post_reactions_new RENAME TO post_reactions;
        CREATE INDEX idx_post_reactions_reacted_at ON post_reactions(reacted_at DESC);
      `);
    }

    db.exec("DROP INDEX IF EXISTS idx_posts_category;");
    db.exec("DROP INDEX IF EXISTS idx_posts_slug;");
    db.exec("DROP INDEX IF EXISTS idx_post_reactions_post_id;");
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.exec("PRAGMA foreign_keys = ON;");
    throw error;
  }

  db.exec("PRAGMA foreign_keys = ON;");
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
  db.prepare(
    `
      INSERT OR IGNORE INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
    `
  ).run("ad_enabled", defaultAdEnabled, now);
  db.prepare(
    `
      INSERT OR IGNORE INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
    `
  ).run("ad_markdown", defaultAdMarkdown, now);
};

export const getDb = (): SqliteDatabase => {
  if (!dbInstance) {
    const DatabaseCtor = loadBetterSqlite();
    dbInstance = new DatabaseCtor(dbPath);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
    initSchema(dbInstance);
    migrateLegacySchemaIfNeeded(dbInstance);
    seedSiteContent(dbInstance);
  }
  return dbInstance;
};
