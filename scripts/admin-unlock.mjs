import path from "node:path";
import process from "node:process";
import Database from "better-sqlite3";

const dbPath = path.join(process.cwd(), "rblog.db");
const db = new Database(dbPath);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      key TEXT PRIMARY KEY,
      fail_count INTEGER NOT NULL,
      window_started_at INTEGER NOT NULL,
      locked_until INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `);
  db.prepare("DELETE FROM admin_login_attempts").run();
  console.log("Rate-limit lock records are cleared.");
} finally {
  db.close();
}
